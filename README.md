# Some Project from KissKiss

## Установка:
1. Сначала надо скачать docker


если у вас GNU/Linux дистрибутив(рекомендовано, но можно docker desctop(см. ниже)) {


  docker engine(https://docs.docker.com/engine/install/)


}


если у вас Windows/Mac (или при желании Gui, то и дистрибутив GNU/Linux){


  docker desctop(https://docs.docker.com/desktop/)


}


2. Затем надо скачать репозиторий (или просто скачать и разорхивировать zip с github):
  ```
  git clone https://github.com/Akulalu07/KissKiss.git
  ```





## Запуск:

1. Надо удостовериться что docker запущен(комманда пишется в терминал/консоль/командную строку):
  ```
  docker version
  ```


  (если выдает ошибку надо запустить docker desctop)


  или


  (если выдает ошибку && у вас docker engine скачан && ваш дистрибутив поддерживает systemctl:



  ```
  sudo systemctl start docker
  sudo systemctl status docker
  ```



  )

2. Надо запустить проект(комманда пишется в терминал/консоль/командную строку):
  ```
  docker compose up --build -d
  ```
  Затем можно получить сайт на http://localhost:8081
