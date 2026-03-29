#!/bin/sh

for candidate in "$PYTHON_WITH_PIL" python3 python /opt/anaconda3/bin/python3 /Library/Frameworks/Python.framework/Versions/3.11/bin/python3; do
  if [ -z "$candidate" ]; then
    continue
  fi

  if ! command -v "$candidate" >/dev/null 2>&1; then
    continue
  fi

  if "$candidate" -c "import PIL" >/dev/null 2>&1; then
    exec "$candidate" "$@"
  fi
done

echo "Could not find a Python interpreter with Pillow installed." >&2
exit 1
