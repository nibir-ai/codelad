# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for license information.

import json
import os
from pathlib import Path
import shutil
import signal
import struct
import subprocess
import sys
import tempfile
import time
import unittest


TOOL = Path(__file__).resolve().parents[2] / 'scripts/codelad/capture-linux-packets.py'


def read_pcap(path):
	data = path.read_bytes()
	magic, major, minor, _, _, snaplen, linktype = struct.unpack('<IHHIIII', data[:24])
	if (magic, major, minor, linktype) != (0xa1b2c3d4, 2, 4, 1):
		raise ValueError('Unexpected PCAP header')
	frames = []
	offset = 24
	while offset < len(data):
		_, micros, captured, original = struct.unpack_from('<IIII', data, offset)
		offset += 16
		if captured > original or captured > snaplen or micros >= 1000000 or offset + captured > len(data):
			raise ValueError('Malformed PCAP record')
		frames.append(data[offset:offset + captured])
		offset += captured
	return frames


@unittest.skipUnless(sys.platform == 'linux' and shutil.which('unshare') and shutil.which('ip'), 'Linux namespace tools required')
class LinuxPacketCaptureTests(unittest.TestCase):
	def setUp(self):
		self.directory = tempfile.TemporaryDirectory(prefix='codelad-packets-test-')
		self.addCleanup(self.directory.cleanup)
		self.output = Path(self.directory.name) / 'capture'

	def command(self, source, *options):
		return [sys.executable, str(TOOL), '--output', str(self.output), '--duration-seconds', '5', *options, '--', sys.executable, '-c', source]

	def run_capture(self, source, *options):
		result = subprocess.run(self.command(source, *options), capture_output=True, text=True, timeout=10)
		metadata = json.loads((self.output / 'capture.json').read_text())
		return result, metadata

	def wait_for(self, read):
		for _ in range(100):
			try:
				result = read()
				if result:
					return result
			except (FileNotFoundError, json.JSONDecodeError):
				pass
			time.sleep(0.02)
		self.fail('Timed out waiting for packet capture evidence')

	def test_short_lived_tcp_and_ipv4_ipv6_dns_are_captured_without_payloads_in_metadata(self):
		host_namespace = os.readlink('/proc/self/ns/net')
		result, metadata = self.run_capture('''
import socket, struct, threading
query = bytes.fromhex('123401000001000000000000') + b'\\x0fPRIVATE_CONTROL\\x07invalid\\x00' + bytes.fromhex('00010001')
for family, address in [(socket.AF_INET, '127.0.0.1'), (socket.AF_INET6, '::1')]:
    with socket.socket(family, socket.SOCK_DGRAM) as server, socket.socket(family, socket.SOCK_DGRAM) as client:
        server.bind((address, 53))
        client.sendto(query, (address, 53))
        packet, peer = server.recvfrom(4096)
        server.sendto(packet[:2] + b'\\x81\\x80' + packet[4:], peer)
        assert client.recv(4096)
with socket.socket() as server:
    server.bind(('127.0.0.1', 0)); server.listen()
    with socket.create_connection(server.getsockname()) as client:
        peer, _ = server.accept()
        with peer:
            client.sendall(b'PRIVATE_TCP_CONTROL')
            assert peer.recv(4096) == b'PRIVATE_TCP_CONTROL'
''')
		frames = read_pcap(self.output / 'packets.pcap')
		dns = []
		for frame in frames:
			kind = struct.unpack_from('!H', frame, 12)[0]
			if kind == 0x0800 and frame[23] == 17:
				offset = 14 + (frame[14] & 15) * 4
			elif kind == 0x86dd and frame[20] == 17:
				offset = 54
			else:
				continue
			source, destination = struct.unpack_from('!HH', frame, offset)
			if 53 in (source, destination):
				dns.append((kind, source == 53, frame[offset + 8:]))
		self.assertEqual({
			'code': result.returncode, 'complete': metadata['captureComplete'], 'drops': metadata['packetSocketDrops'],
			'remaining': metadata['remainingProcessCount'], 'frames': metadata['framesRecorded'] == len(frames),
			'dns_families': sorted({kind for kind, _, _ in dns}), 'dns_directions': sorted({response for _, response, _ in dns}),
			'tcp_marker': any(b'PRIVATE_TCP_CONTROL' in frame for frame in frames),
			'metadata_leaks': 'PRIVATE_' in json.dumps(metadata), 'stdout_leaks': 'PRIVATE_' in result.stdout + result.stderr,
			'isolated': metadata['networkNamespace'] != host_namespace, 'host_unchanged': os.readlink('/proc/self/ns/net') == host_namespace,
			'modes': [self.output.stat().st_mode & 0o777, (self.output / 'capture.json').stat().st_mode & 0o777, (self.output / 'packets.pcap').stat().st_mode & 0o777]
		}, {
			'code': 0, 'complete': True, 'drops': 0, 'remaining': 0, 'frames': True,
			'dns_families': [0x0800, 0x86dd], 'dns_directions': [False, True], 'tcp_marker': True,
			'metadata_leaks': False, 'stdout_leaks': False, 'modes': [0o700, 0o600, 0o600],
			'isolated': True, 'host_unchanged': True
		}, result.stderr)

	def test_discovered_namespace_children_outlive_the_command_and_are_captured(self):
		child = "import time,socket; time.sleep(0.2); s=socket.socket(socket.AF_INET,socket.SOCK_DGRAM); s.sendto(b'ORPHAN_CONTROL',('127.0.0.1',55353)); s.close()"
		result, metadata = self.run_capture(f"import subprocess,sys; subprocess.Popen([sys.executable,'-c',{child!r}])")
		self.assertEqual((result.returncode, metadata['captureComplete'], metadata['remainingProcessCount'], any(b'ORPHAN_CONTROL' in frame for frame in read_pcap(self.output / 'packets.pcap'))), (0, True, 0, True), result.stderr)

	def test_timeout_ends_the_private_process_tree_and_reports_incomplete_capture(self):
		result, metadata = self.run_capture('import time; time.sleep(60)', '--duration-seconds', '0.15')
		self.assertEqual((result.returncode, metadata['captureComplete'], metadata['reason'], metadata['remainingProcessCount']), (1, False, 'duration-limit', 0), result.stderr)

	def test_truncation_and_byte_limits_never_report_complete_capture(self):
		for options, reason in [(('--snaplen', '64'), 'process-tree-exited'), (('--max-bytes', '64'), 'byte-limit')]:
			with self.subTest(options=options):
				self.output = Path(self.directory.name) / options[0].removeprefix('--')
				result, metadata = self.run_capture("import socket; s=socket.socket(socket.AF_INET,socket.SOCK_DGRAM); s.sendto(b'x'*512,('127.0.0.1',55353))", *options)
				self.assertEqual((result.returncode, metadata['captureComplete'], metadata['reason'], metadata['remainingProcessCount']), (1, False, reason, 0), result.stderr)

	def test_existing_capture_and_invalid_host_entry_are_refused(self):
		self.output.mkdir()
		marker = self.output / 'PRIVATE_EXISTING'
		marker.write_text('retained')
		result = subprocess.run(self.command('pass'), capture_output=True, text=True, timeout=5)
		inside = subprocess.run(self.command('pass', '--inside', '--parent-network', 'invalid', '--parent-pid', 'invalid'), capture_output=True, text=True, timeout=5)
		self.assertEqual((result.returncode != 0, marker.read_text(), inside.returncode != 0, (self.output / 'packets.pcap').exists()), (True, 'retained', True, False))

	def test_command_failure_is_distinct_from_capture_failure(self):
		result, metadata = self.run_capture('raise SystemExit(17)')
		self.assertEqual((result.returncode, metadata['captureComplete'], metadata['commandExitCode']), (17, True, 17), result.stderr)

	def test_parent_death_cancels_the_namespace_and_preserves_failure_metadata(self):
		child = subprocess.Popen(self.command('import time; time.sleep(60)'), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
		self.addCleanup(lambda: child.poll() is None and child.kill())
		self.wait_for(lambda: json.loads((self.output / 'capture.json').read_text()).get('status') == 'capturing')
		child.kill()
		child.wait(timeout=5)
		metadata = self.wait_for(lambda: value if (value := json.loads((self.output / 'capture.json').read_text())).get('status') == 'finished' else None)
		self.assertEqual((metadata['captureComplete'], metadata['reason'], metadata['remainingProcessCount']), (False, 'parent-exited', 0))

	def test_interrupt_is_not_a_successful_capture(self):
		child = subprocess.Popen(self.command('import time; time.sleep(60)'), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
		self.addCleanup(lambda: child.poll() is None and child.kill())
		self.wait_for(lambda: json.loads((self.output / 'capture.json').read_text()).get('status') == 'capturing')
		child.send_signal(signal.SIGTERM)
		code = child.wait(timeout=5)
		metadata = json.loads((self.output / 'capture.json').read_text())
		self.assertEqual((code, metadata['captureComplete'], metadata['reason']), (1, False, 'interrupted'))

	def test_child_network_namespace_change_is_incomplete_and_cleaned_up(self):
		result, metadata = self.run_capture("import subprocess,sys; subprocess.run(['unshare','--net',sys.executable,'-c','import time; time.sleep(60)'])")
		self.assertEqual((result.returncode, metadata['captureComplete'], metadata['reason'], metadata['remainingProcessCount']), (1, False, 'capture-error', 0), result.stderr)

	def test_failed_command_startup_does_not_record_arguments_in_errors(self):
		result = subprocess.run([sys.executable, str(TOOL), '--output', str(self.output), '--', '/missing-codelad-fixture', 'PRIVATE_TOKEN'], capture_output=True, text=True, timeout=5)
		metadata = json.loads((self.output / 'capture.json').read_text())
		self.assertEqual((result.returncode, metadata['captureComplete'], metadata['commandExitCode'], 'PRIVATE_TOKEN' in json.dumps(metadata) + result.stdout + result.stderr), (1, False, None, False))


if __name__ == '__main__':
	unittest.main()
