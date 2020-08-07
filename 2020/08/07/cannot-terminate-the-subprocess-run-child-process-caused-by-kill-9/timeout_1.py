# -*- coding: utf-8 -*-
"""
JUST FOR TEST.
"""
import os
import sys
import json
import uuid
import base64
import shutil
import signal
import requests
import subprocess

process = None

def sigintHandler(signum, frame):
    print("中断发生。")
    global process
    process.kill();
    print("执行最后的清理工作。")
    exit()

def run_cmd(cmd, cwd):
    signal.signal(signal.SIGTERM, sigintHandler)
    global process
    with subprocess.Popen(
        cmd,
        cwd=cwd,
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        encoding="utf-8",
    ) as process:
        try:
            stdout, stderr = process.communicate(input, timeout=timeout)
        except TimeoutExpired as exc:
            process.kill()
            if _mswindows:
                # Windows accumulates the output in a single blocking
                # read() call run on child threads, with the timeout
                # being done in a join() on those threads.  communicate()
                # _after_ kill() is required to collect that and add it
                # to the exception.
                exc.stdout, exc.stderr = process.communicate()
            else:
                # POSIX _communicate already populated the output so
                # far into the TimeoutExpired exception.
                process.wait()
            raise
        except:  # Including KeyboardInterrupt, communicate handled that.
            process.kill()
            # We don't call process.wait() as .__exit__ does that for us.
            raise
        retcode = process.poll()
        if retcode:
            raise subprocess.CalledProcessError(retcode, process.args,
                                     output=stdout, stderr=stderr)
    return subprocess.CompletedProcess(process.args, retcode, stdout, stderr)

if __name__ == '__main__':
    currentDir, _ = os.path.split(os.path.abspath(__file__))
    run_cmd("sh timeout.sh", currentDir)
