#!/bin/bash
cd /home/kavia/workspace/code-generation/ai-assistance-platform-4294-4344/react_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

