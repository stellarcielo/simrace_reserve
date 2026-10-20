#!/bin/sh
set -e

# docker cp やバインドマウントで root 所有になった DB でも書き込めるよう、所有者を node に揃える
chown -R node:node /app/data

# node ユーザーに切り替えて、マイグレーション適用 → サーバー起動
export HOME=/home/node
exec setpriv --reuid=node --regid=node --init-groups sh -c \
  'node_modules/.bin/prisma migrate deploy && exec node_modules/.bin/next start -H 0.0.0.0 -p 4000'
