# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for license information.

"""Capture a command's offline loopback traffic in disposable Linux namespaces."""

import argparse
import datetime
import json
import os
from pathlib import Path
import selectors
import signal
import socket
import struct
import subprocess
import sys
import time


def timestamp():
	return datetime.datetime.now(datetime.timezone.utc).isoformat()


def write_metadata(directory, metadata):
	path = directory / 'capture.json.tmp'
	descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC | os.O_NOFOLLOW, 0o600)
	with os.fdopen(descriptor, 'w') as output:
		json.dump(metadata, output, indent=2)
		output.write('\n')
		output.flush()
		os.fsync(output.fileno())
	os.replace(path, directory / 'capture.json')


def validate_namespace(parent_network, parent_pid):
	network = os.readlink('/proc/self/ns/net')
	pid = os.readlink('/proc/self/ns/pid')
	if (os.getpid() != 1 or network == parent_network or pid == parent_pid
		or os.readlink('/proc/1/ns/pid') != pid
		or [name for _, name in socket.if_nameindex()] != ['lo']):
		raise RuntimeError('Capture requires the new loopback-only network/PID namespaces and private proc mount.')
	return network, pid


def live_processes(network):
	live = []
	for entry in Path('/proc').iterdir():
		if not entry.name.isdigit() or int(entry.name) == os.getpid():
			continue
		try:
			state = (entry / 'stat').read_text().rsplit(') ', 1)[1].split()[0]
			if state in ('Z', 'X'):
				continue
			if network is not None and os.readlink(entry / 'ns/net') != network:
				raise RuntimeError('A child entered another network namespace; coverage is incomplete.')
			live.append(int(entry.name))
		except (FileNotFoundError, ProcessLookupError):
			continue
	return live


def terminate_processes(pid_namespace):
	if os.getpid() != 1 or os.readlink('/proc/1/ns/pid') != pid_namespace:
		raise RuntimeError('Refused process cleanup outside the private PID namespace.')
	for sig in (signal.SIGTERM, signal.SIGKILL):
		for pid in live_processes(None):
			try:
				os.kill(pid, sig)
			except ProcessLookupError:
				pass
		if sig == signal.SIGTERM:
			time.sleep(0.2)


def capture(args, directory, metadata, namespace):
	network, pid = namespace
	subprocess.run(['ip', 'link', 'set', 'dev', 'lo', 'up'], check=True, stdout=subprocess.DEVNULL)
	metadata.update(networkNamespace=network, pidNamespace=pid, interface='lo', postExitDrainSeconds=1,
		framesRecorded=0, truncatedFrames=0, bytesWritten=24, packetSocketDrops=None,
		commandExitCode=None, remainingProcessCount=None, reason='capturing')
	child = None
	packet_socket = None
	selector = selectors.DefaultSelector()
	try:
		packet_socket = socket.socket(socket.AF_PACKET, socket.SOCK_RAW, socket.htons(3))
		packet_socket.setsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF, 4 * 1024 * 1024)
		packet_socket.bind(('lo', 0))
		packet_socket.setblocking(False)
		selector.register(packet_socket, selectors.EVENT_READ)
		selector.register(args.parent_watch_fd, selectors.EVENT_READ)
		metadata['receiveBufferBytes'] = packet_socket.getsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF)
		descriptor = os.open(directory / 'packets.pcap', os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
		with os.fdopen(descriptor, 'wb') as output:
			output.write(struct.pack('<IHHIIII', 0xa1b2c3d4, 2, 4, 0, 0, args.snaplen, 1))
			output.flush()
			metadata.update(status='capturing', captureStartedAt=timestamp())
			write_metadata(directory, metadata)
			started = time.monotonic()
			child = subprocess.Popen(args.command)
			drain_until = None
			while True:
				ready = selector.select(0.05)
				if any(key.fd == args.parent_watch_fd for key, _ in ready):
					metadata['reason'] = 'parent-exited'
					raise RuntimeError('The parent audit process exited; coverage is incomplete.')
				if ready:
					for _ in range(256):
						try:
							packet, _, flags, _ = packet_socket.recvmsg(1024 * 1024)
						except BlockingIOError:
							break
						if flags & socket.MSG_TRUNC:
							raise RuntimeError('A frame exceeded the receive buffer; coverage is incomplete.')
						captured = packet[:args.snaplen]
						if metadata['bytesWritten'] + 16 + len(captured) > args.max_bytes:
							metadata['reason'] = 'byte-limit'
							raise RuntimeError('The private packet file reached its byte limit.')
						now = time.time_ns()
						output.write(struct.pack('<IIII', now // 1_000_000_000, now % 1_000_000_000 // 1000, len(captured), len(packet)))
						output.write(captured)
						metadata['framesRecorded'] += 1
						metadata['truncatedFrames'] += len(captured) < len(packet)
						metadata['bytesWritten'] += 16 + len(captured)
				metadata['commandExitCode'] = child.poll()
				if metadata['commandExitCode'] is not None:
					while True:
						try:
							if os.waitpid(-1, os.WNOHANG)[0] == 0:
								break
						except ChildProcessError:
							break
				remaining = live_processes(network)
				metadata['remainingProcessCount'] = len(remaining)
				if [name for _, name in socket.if_nameindex()] != ['lo']:
					raise RuntimeError('Network interfaces changed; coverage is incomplete.')
				if metadata['commandExitCode'] is not None and not remaining:
					if drain_until is None:
						drain_until = time.monotonic() + 1
					if time.monotonic() >= drain_until:
						metadata['reason'] = 'process-tree-exited'
						break
				if time.monotonic() - started >= args.duration_seconds:
					metadata['reason'] = 'duration-limit'
					break
			output.flush()
			os.fsync(output.fileno())
	except (OSError, RuntimeError, subprocess.SubprocessError) as error:
		if metadata['reason'] == 'capturing':
			metadata['reason'] = 'capture-error'
		metadata['error'] = str(error) if isinstance(error, RuntimeError) else 'Capture or command startup failed; review local evidence.'
	finally:
		if packet_socket is not None:
			packets, drops = struct.unpack('II', packet_socket.getsockopt(263, 6, 8))
			metadata['packetSocketPackets'] = packets
			metadata['packetSocketDrops'] = drops
			packet_socket.close()
		selector.close()
		os.close(args.parent_watch_fd)
		if metadata['reason'] != 'process-tree-exited':
			terminate_processes(pid)
		if child is not None:
			metadata['commandExitCode'] = child.wait()
		metadata['remainingProcessCount'] = len(live_processes(None))
		metadata['captureComplete'] = (metadata['reason'] == 'process-tree-exited'
			and metadata['remainingProcessCount'] == 0 and metadata['packetSocketDrops'] == 0
			and metadata.get('packetSocketPackets') == metadata['framesRecorded']
			and metadata['truncatedFrames'] == 0 and 'error' not in metadata)
		metadata.update(status='finished', finishedAt=timestamp())
		write_metadata(directory, metadata)
	if not metadata['captureComplete']:
		return 1
	code = metadata['commandExitCode']
	return code if code >= 0 else 128 - code


def main():
	parser = argparse.ArgumentParser(description=__doc__)
	parser.add_argument('--output', required=True, type=Path)
	parser.add_argument('--duration-seconds', type=float, default=180)
	parser.add_argument('--snaplen', type=int, default=262144)
	parser.add_argument('--max-bytes', type=int, default=128 * 1024 * 1024)
	parser.add_argument('--inside', action='store_true', help=argparse.SUPPRESS)
	parser.add_argument('--parent-network', help=argparse.SUPPRESS)
	parser.add_argument('--parent-pid', help=argparse.SUPPRESS)
	parser.add_argument('--parent-watch-fd', type=int, help=argparse.SUPPRESS)
	parser.add_argument('command', nargs=argparse.REMAINDER)
	args = parser.parse_args()
	if args.command[:1] == ['--']:
		args.command = args.command[1:]
	if (sys.platform != 'linux' or not args.command or not 0 < args.duration_seconds <= 3600
		or not 64 <= args.snaplen <= 262144 or not 24 <= args.max_bytes <= 1024 * 1024 * 1024):
		parser.error('Use Linux, a command after --, a duration of 0–3600 seconds, snaplen 64–262144 and a byte limit of 24–1073741824.')
	directory = args.output.resolve()
	if args.inside:
		try:
			namespace = validate_namespace(args.parent_network, args.parent_pid)
		except (OSError, RuntimeError):
			print('Refused capture outside the disposable namespaces.', file=sys.stderr)
			return 1
		try:
			metadata = json.loads((directory / 'capture.json').read_text())
		except (OSError, ValueError):
			print('Could not read private startup metadata.', file=sys.stderr)
			return 1
		if metadata.get('status') != 'starting':
			return 1
		try:
			return capture(args, directory, metadata, namespace)
		except (OSError, RuntimeError, subprocess.SubprocessError):
			metadata.update(status='failed', captureComplete=False, reason='capture-error', error='Namespace verification or capture cleanup failed.', finishedAt=timestamp())
			write_metadata(directory, metadata)
			return 1
	directory.parent.mkdir(parents=True, exist_ok=True)
	try:
		directory.mkdir(mode=0o700)
	except FileExistsError:
		parser.error('Choose a new output directory; existing captures are never reused.')
	metadata = {
		'status': 'starting', 'captureComplete': False, 'startedAt': timestamp(),
		'coverage': 'Raw Ethernet frames on loopback in new network and PID namespaces, including command descendants. Offline only; separate host/DBus services and blocked attempts are outside this capture.',
		'commandExecutable': Path(args.command[0]).name, 'durationSeconds': args.duration_seconds,
		'snaplen': args.snaplen, 'maxBytes': args.max_bytes,
		'limitations': 'Loopback includes outgoing/incoming copies. Timestamps are receipt times. Raw packets can contain secrets. This is not host-wide capture, online behavior, or a universal no-telemetry verdict.'
	}
	write_metadata(directory, metadata)
	parent_read, parent_write = os.pipe()
	command = ['unshare', '--user', '--map-root-user', '--mount', '--net', '--pid', '--fork', '--mount-proc', '--kill-child=SIGKILL', '--',
		sys.executable, str(Path(__file__).resolve()), '--inside', '--parent-network', os.readlink('/proc/self/ns/net'),
		'--parent-pid', os.readlink('/proc/self/ns/pid'), '--parent-watch-fd', str(parent_read), '--output', str(directory), '--duration-seconds', str(args.duration_seconds),
		'--snaplen', str(args.snaplen), '--max-bytes', str(args.max_bytes), '--', *args.command]
	interrupted = False
	child = None
	def interrupt(signum, frame):
		nonlocal interrupted
		interrupted = True
		if child is not None:
			try:
				os.killpg(child.pid, signal.SIGKILL)
			except ProcessLookupError:
				pass
	signal.signal(signal.SIGINT, interrupt)
	signal.signal(signal.SIGTERM, interrupt)
	try:
		child = subprocess.Popen(command, start_new_session=True, pass_fds=(parent_read,))
		if interrupted:
			interrupt(signal.SIGTERM, None)
		code = child.wait()
	except OSError:
		code = 1
	finally:
		os.close(parent_read)
		os.close(parent_write)
	try:
		metadata = json.loads((directory / 'capture.json').read_text())
	except (OSError, ValueError):
		metadata = {'captureComplete': False, 'status': 'unreadable'}
	if interrupted or metadata.get('status') not in ('finished', 'failed'):
		reason = 'namespace-startup-failed' if metadata.get('status') == 'starting' else 'capture-process-failed'
		metadata.update(status='failed', captureComplete=False, reason='interrupted' if interrupted else reason, finishedAt=timestamp())
		write_metadata(directory, metadata)
		return 1
	return code if code >= 0 else 128 - code


if __name__ == '__main__':
	sys.exit(main())
