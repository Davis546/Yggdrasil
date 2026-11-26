#!/usr/bin/env bash
set -euo pipefail
# V4.5 substitui as ilustrações nórdicas antigas por ícones exclusivamente rúnicos.
rm -rf public/assets/cards/nordic
# Trilha antiga da onda 15 foi substituída pela música M4A recebida.
rm -f public/assets/audio/nameless_ost.mp3
printf 'Yggdrasil v4.5 preparado: Odin, Futhark e dragão de fogo.\n'
