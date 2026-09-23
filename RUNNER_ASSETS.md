# Runner — извлечённые игровые ассеты

Источник: https://playbox.play.plbx.ai/playoff/runner (игровой HTML `/_raw`).

## Содержимое

- `assets/Sprites/Runner/` — 31 исходное изображение: два атласа, окружение, препятствия, коллекционные предметы, эффекты и UI.
- `assets/Sprites/Runner/Frames/` — 85 отдельных PNG-кадров из атласов. Кадры восстановлены до исходного размера с учётом `spriteSourceSize`, поэтому персонаж не «скачет» при смене кадров.
- `assets/Audio/Runner/` — 8 MP3: jump, hit, hurt, collect, step, win, lose, music. Исходные уровни громкости и зацикливание записаны в `audio-index.json`.
- `assets/Fonts/Runner/GameFont.ttf` — встроенный шрифт игры.
- `assets/Animations/Runner/animation-index.json` — последовательности кадров, скорость и режим повторения.
- `assets/Animations/Runner/*-atlas.json` — исходные координаты кадров в атласах.
- `assets/Animations/Runner/Previews/` — 5 GIF для быстрого просмотра анимаций.
- `assets/Animations/Runner/source-motion.css` — 10 исходных CSS `@keyframes` для интерфейса.
- `assets/Animations/Runner/procedural-effects.json` — параметры анимации пульсации, свечения, канатов и конфетти.

## Скорость кадровых анимаций

| Персонаж | Анимация | Кадров | FPS | Повтор |
| --- | --- | ---: | ---: | --- |
| Player | idle | 18 | 9 | да |
| Player | run | 8 | 9 | да |
| Player | jump | 10 | 13.5 | нет |
| Player | hurt | 5 | 18 | нет |
| Enemy | default | 44 | 12 | да |

Оригинал проигрывает эти последовательности через Pixi `AnimatedSprite`. На странице нет готовых Cocos `.anim`: для создания Clip в Cocos используйте PNG-кадры в порядке из `animation-index.json` и указанный FPS. GIF-файлы служат превью.

Движение конфетти, канатов, мерцание объектов и анимации интерфейса вычисляются в коде исходной игры. Их параметры и CSS-кадры сохранены для переноса в Cocos.
