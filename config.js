SERVER_IP = "192.168.6.222";
ISHTTP = false;
PORT = 3000;
BASE_URL = (ISHTTP==true?"https":"http")+`://${SERVER_IP}:${PORT}/`;
MONGODB_URI = `mongodb://127.0.0.1:27017/attend`;
SECRET = "d&dj=324yf7";
ADMIN_EMAIL = "jsgrowing315@outlook.com";
CUR_LANG = "en";
LANGS = {
    en:{
       "not_attend":"Did not attend"
    },
    arab:{
        "not_attend":"موقوف",
        "attended":"فعال"
    }
};
SOCKETSERVER = null;