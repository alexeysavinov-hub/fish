ПОРТ 41 — сайт (мобильная + десктопная версии)

Загрузка на FTP: скопируйте содержимое этой папки в корень хостинга (public_html / www).

Структура:
  index.html       главная
  catalog.html     каталог (фильтр ?cat=ikra|ryba|krab|more|krevetki|pf|kons|other)
  product.html     карточка товара (?id=…)
  cart.html        корзина и оформление
  favorites.html   избранное
  delivery.html, about.html, wholesale.html, contacts.html, news.html
  css/style.css    стили (mobile-first, брейкпоинты 640 / 1024 px)
  js/data.js       ТОВАРЫ, КАТЕГОРИИ, НОВОСТИ, контакты — редактировать здесь
  js/app.js        логика: шапка, меню, поиск, корзина (localStorage), формы
  assets/          логотипы и фото (assets/img)

Подключение заказов: в js/app.js найдите комментарий «Здесь подключите отправку» —
вставьте fetch на ваш бэкенд / Telegram-бот / CRM. Сейчас заказ показывает экран
подтверждения без отправки на сервер.

Шрифты Yeseva One и Golos Text грузятся с Google Fonts.