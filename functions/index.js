const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const mongoose = require("mongoose");
const routes = require("./src/routes");
const cors = require("cors");

//Arquivo serviceAccountKey.json deve ser gerado no Firebase
const serviceAccount = require("./firebaseArchives/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // Deve ser a sua url do banco, algo como:
  databaseURL: "https://track-and-roll.firebaseio.com",
});

mongoose.connect(
  // Sua url do banco mongo, algo como:
  "mongodb+srv://[project]:[project]@homolog...",
  { useNewUrlParser: true, useUnifiedTopology: true }
);

const app = express(); //Cria o server
app.use(express.json()); //Configura o servidor para ouvir json
app.use(cors()); //Permite outros endereços acessar a api
app.use(routes); //Usa as rotas

exports.app = functions.https.onRequest(app);
