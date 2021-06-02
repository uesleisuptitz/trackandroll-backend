const usuario = require("../models/usuario");
const show = require("../models/show");
const admin = require("firebase-admin");
const auth = admin.auth;

exports.criarUsuario = async (req, res) => {
  try {
    const { authorization } = req.headers;
    if (authorization && authorization.split(" ")[1]) {
      let {
        nome,
        email,
        contato,
        tipo, //1 === Bar - 2 === Banda
        //Bar
        endereco,
        infraestrutura,
        //Banda
        generos,
        repertorio,
        equipamentos,
        integrantes,
      } = req.body;
      if (!nome || !email || !contato || !tipo)
        return res.status(400).send({
          mensagem: "Todos os campos obrigatórios devem ser enviados!",
        });
      else {
        await auth()
          .verifyIdToken(authorization.split(" ")[1])
          .then(({ user_id: _id }) => {
            if (tipo === 1)
              usuario
                .create({
                  _id,
                  nome,
                  email,
                  contato,
                  tipo,
                  endereco,
                  infraestrutura,
                })
                .then((data) =>
                  res.json({
                    mensagem: "Usuário criado com sucesso!",
                    usuario: data,
                  })
                )
                .catch((e) =>
                  res.status(404).send({
                    mensagem: "Ocorreu um erro ao tentar criar seu usuário!",
                    erro: e,
                  })
                );
            else
              usuario
                .create({
                  _id,
                  nome,
                  email,
                  contato,
                  tipo,
                  generos,
                  repertorio,
                  equipamentos,
                  integrantes,
                })
                .then((data) =>
                  res.json({
                    mensagem: "Usuário criado com sucesso!",
                    usuario: data,
                  })
                )
                .catch((e) =>
                  res.status(404).send({
                    mensagem: "Ocorreu um erro ao tentar criar seu usuário!",
                    erro: e,
                  })
                );
          })
          .catch((e) =>
            res.status(403).send({
              mensagem: "Usuário sem permissão!",
              erro: e,
            })
          );
      }
    } else
      return res.status(403).send({
        mensagem: "Token inválido!",
      });
  } catch (e) {
    console.log("ERROR:", e);
    return res.status(500).send({
      mensagem: "Falha ao processar sua requisição",
    });
  }
};

exports.editarUsuario = async (req, res) => {
  try {
    const { authorization } = req.headers;
    if (authorization && authorization.split(" ")[1]) {
      const {
        nome,
        email,
        contato,
        endereco,
        infraestrutura,
        generos,
        equipamentos,
        repertorio,
        integrantes,
      } = req.body;

      await auth()
        .verifyIdToken(authorization.split(" ")[1])
        .then(async ({ user_id }) => {
          let userDB = await usuario.findById(user_id);
          if (!userDB)
            return res.status(404).send({
              mensagem: "O usuário não encontrado!",
            });
          else {
            if (nome) userDB.set({ nome });
            if (email) userDB.set({ email });
            if (contato) userDB.set({ contato });
            if (userDB.tipo === 1) {
              if (endereco) userDB.set({ endereco });
              if (infraestrutura) userDB.set({ infraestrutura });
            }
            if (userDB.tipo === 2) {
              if (generos) userDB.set({ generos });
              if (equipamentos) userDB.set({ equipamentos });
              if (repertorio) userDB.set({ repertorio });
              if (integrantes) userDB.set({ integrantes });
            }
            await userDB
              .save()
              .then(() =>
                res.status(200).send({
                  mensagem: "Usuário alterado com sucesso!",
                  usuario: userDB,
                })
              )
              .catch((e) =>
                res.status(404).send({
                  mensagem: "Ocorreu um erro ao tentar alterar o usuário!",
                  erro: e,
                })
              );
          }
        })
        .catch((e) =>
          res.status(403).send({ mensagem: "Usuário sem permissão!", erro: e })
        );
    } else
      return res.status(403).send({
        mensagem: "Token inválido!",
      });
  } catch (e) {
    console.log("ERROR:", e);
    return res.status(500).send({
      mensagem: "Falha ao processar sua requisição",
    });
  }
};

exports.excluirUsuario = async (req, res) => {
  try {
    const idUser = req.headers.iduser;
    const hoje = new Date();

    userDB = await usuario.findById(idUser);

    if (!idUser)
      return res.status(403).send({
        mensagem: "Usuário inválido!",
      });
    if (!userDB)
      return res.status(404).send({
        mensagem: "O usuário não foi encontrado!",
      });
    if (userDB.tipo === 1) {
      //Bar
      let showsDB = await show.find({
        $and: [{ idBar: idUser }, { data: { $gte: hoje } }],
      });

      if (showsDB) {
        await showsDB.remove(); //Remove shows do bar que iriam acontecer
      }
      await userDB.remove();

      return res.status(200).send({
        mensagem: "O usuário foi excluído com sucesso!",
      });
    } else {
      //Banda
      let showsDB = await show.find({
        $and: [
          {
            $or: [
              { idBanda: idUser },
              { bandas: { $in: idUser } },
              { bandasAceitas: { $in: idUser } },
              { bandasRejeitadas: { $in: idUser } },
            ],
          },
          { data: { $gte: hoje } },
        ],
      }); //Filtro que seleciona os shows futuros onde a banda estava alistada ou se prontificou a fazer.

      //Remove registros da banda em shows futuros
      if (showsDB.idBanda) await showsDB.idBanda.pull(idUser);
      if (showsDB.bandas) await showsDB.bandas.pull(idUser);
      if (showsDB.bandasAceitas) await showsDB.bandasAceitas.pull(idUser);
      if (showsDB.bandasRejeitadas) await showsDB.bandasRejeitadas.pull(idUser);

      await userDB.remove();

      return res.status(200).send({
        mensagem: "O usuário foi excluído com sucesso!",
      });
    }
  } catch (e) {
    console.log("ERROR:", e);
    res.status(500).send({
      mensagem: "Falha ao processar sua requisição",
    });
  }
};

exports.dadosUsuario = async (req, res) => {
  try {
    const { authorization } = req.headers;
    if (authorization && authorization.split(" ")[1]) {
      await auth()
        .verifyIdToken(authorization.split(" ")[1])
        .then(({ user_id }) => {
          const { userId: userBody } = req.body;
          let userId = userBody ? userBody : user_id;
          usuario
            .findById(userId)
            .then((usuarioDB) =>
              res.json({ mensagem: "Usuário encontrado!", usuario: usuarioDB })
            )
            .catch((e) =>
              res
                .status(404)
                .send({ mensagem: "Usuário não encontrado!", erro: e })
            );
        })
        .catch((e) =>
          res.status(403).send({ mensagem: "Usuário sem permissão!", erro: e })
        );
    } else
      return res.status(403).send({
        mensagem: "Token inválido!",
      });
  } catch (e) {
    console.log("ERROR:", e);
    return res.status(500).send({
      mensagem: "Falha ao processar sua requisição",
    });
  }
};

exports.dadosOutroUsuario = async (req, res) => {
  try {
    const { authorization } = req.headers;
    const { userId } = req.body;
    if (!userId)
      return res.status(404).send({ mensagem: "Usuário não informado!" });
    else if (authorization && authorization.split(" ")[1]) {
      await auth()
        .verifyIdToken(authorization.split(" ")[1])
        .then(() => {
          usuario
            .findById(userId)
            .then((usuarioDB) =>
              res.json({ mensagem: "Usuário encontrado!", usuario: usuarioDB })
            )
            .catch((e) =>
              res
                .status(404)
                .send({ mensagem: "Usuário não encontrado!", erro: e })
            );
        })
        .catch((e) =>
          res.status(403).send({ mensagem: "Usuário sem permissão!", erro: e })
        );
    } else
      return res.status(403).send({
        mensagem: "Token inválido!",
      });
  } catch (e) {
    console.log("ERROR:", e);
    return res.status(500).send({
      mensagem: "Falha ao processar sua requisição",
    });
  }
};
