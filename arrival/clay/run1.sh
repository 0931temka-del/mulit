for i in 1 2 3 4; do python3 veo_run.py "$1" "$2" "$3" "$4" lite && break; python3 -c "import time; time.sleep(90)"; done
