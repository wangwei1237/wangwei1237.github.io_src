# -*- coding: utf-8 -*-
"""
JUST FOR TEST.
"""

import sys
import shutil
import os
import json
import uuid
import subprocess
import base64
import requests

def run_cmd(cmd, cwd):
    res = subprocess.run(
        cmd,
        cwd=cwd,
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        encoding="utf-8",
        timeout=600
    )

    print(res.returncode)
    print(res)

    str_res = ''
    if 0 == res.returncode:
        str_res = str(res.stdout)
    else:
        str_res = str(res.stderr)
    return str_res


if __name__ == '__main__':
    currentDir, _ = os.path.split(os.path.abspath(__file__))
    run_cmd("sh timeout.sh", currentDir)
