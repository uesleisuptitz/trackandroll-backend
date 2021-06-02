const express = require("express");
const usuarioController = require("./controllers/usuario-controller");
const showController = require("./controllers/show-controller");

const routes = express.Router();

//CRUD usuário
routes.post("/usuario", usuarioController.criarUsuario); //Pronto
routes.get("/usuario", usuarioController.dadosUsuario); //Pronto
routes.post("/usuario/outro", usuarioController.dadosOutroUsuario); //Pronto
routes.put("/usuario", usuarioController.editarUsuario); //Pronto
routes.delete("/usuario", usuarioController.excluirUsuario);

//CRUD show
routes.post("/show", showController.criarShow); //Pronto
routes.get("/show", showController.listarShows); //Pronto
routes.put("/show", showController.editarShow); //Pronto
routes.delete("/show", showController.excluirShow);

//Outras rotas show
routes.get("/show/buscar", showController.buscarShows); //Pronto
routes.put("/show/alistar-banda", showController.alistarBanda); //Pronto
routes.put("/show/desistir", showController.desistirShow); //Pronto
routes.post("/show/detalhes-bandas", showController.detalhesBandas); //Pronto
routes.put("/show/escolher-bandas", showController.escolherBandas); //Pronto
routes.put("/show/escolher-banda", showController.escolherBanda); //Pronto
routes.put("/show/avaliar", showController.avaliarShow); //Pronto

module.exports = routes;
