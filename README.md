# Simple Chat App

Shipped with following these stacks:

### Techstack development

1. [Fast API](https://fastapi.tiangolo.com/lo/)
2. [React Native](https://reactnative.dev/)
3. [MongoDB](https://www.mongodb.com/)
4. [Web Socket](https://fastapi.tiangolo.com/advanced/websockets/)

### BACKEND
1. run ```pip install -r requirements.txt``` to install necessary packages
2. run ```uvicorn main:app --reload``` to run the server
3. visit http://localhost:8000/docs#/ to see the api docs


### FRONTEND
1. RUN ```yarn install``` to install necessary libraries
2. RUN ```yarn android``` or ```npm run android```
3. Reverse the TCP port ``` adb reverse tcp:8000 tcp:8000```




