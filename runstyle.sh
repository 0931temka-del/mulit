for i in 1 2 3 4; do python3 gemini_restyle.py $1 2>&1 | cut -c1-120 | grep -E "^ok" && break; python3 -c "import time; time.sleep(60)"; done
