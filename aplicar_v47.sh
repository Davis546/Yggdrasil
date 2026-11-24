#!/usr/bin/env bash
set -euo pipefail
for file in public/game.js public/audio.js public/assets/enemies/pecado_sheet.png public/assets/nordic/nameless_knight_sheet.png public/assets/nordic/odin_sheet.png src/worker.mjs; do
  if [[ ! -f "$file" ]]; then
    echo "ARQUIVO AUSENTE: $file. Instale a v4.6 completa antes de aplicar este patch." >&2
    exit 1
  fi
done
printf 'Yggdrasil v4.7: etapa de validação concluída; recursos visuais preservados.\n'
