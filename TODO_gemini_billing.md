# Вечером: включить генерацию картинок Gemini (реальные люди)

Статус: ключ GEMINI_API_KEY рабочий, но генерация изображений даёт 429 — на бесплатном тарифе квота для image-моделей = 0.

## Что сделать
1. https://aistudio.google.com/apikey — найти ключ из окружения, посмотреть проект (колонка Project).
2. Страница Spend / «Set up billing» — платный тариф (карта Visa •••• 2345 уже привязана в профиле).
3. Пополнить баланс (prepayment) на небольшую сумму и поставить spending cap (например $5).
4. https://aistudio.google.com/usage — тариф должен стать Paid (через пару минут).
5. Написать Claude «тариф Paid» — он запустит `python3 gen_images.py` и `python3 assemble_test.py`, покажет out/test_ai.mp4 и кадры.

## Стоимость
- $300 Welcome credit — это для Google Cloud, Gemini API он НЕ покрывает («Excludes Gemini API»).
- Оплата за использование. 6 кадров для теста ≈ несколько центов (примерно 4 цента за картинку у gemini-2.5-flash-image; точно — https://ai.google.dev/gemini-api/docs/pricing).

## Пока без Google
3D-версия на three.js: `out/test_3d.mp4` (render.mjs, web/main.js).
