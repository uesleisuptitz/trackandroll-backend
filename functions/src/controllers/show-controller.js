const show = require("../models/show");
const usuario = require("../models/usuario");
const admin = require("firebase-admin");
const auth = admin.auth;

//Função para criar um show que será disponibilizado para as bandas.
exports.criarShow = async (req, res) => {
  try {
    const { authorization } = req.headers;
    if (authorization && authorization.split(" ")[1]) {
      const { nome, descricao, generos, data } = req.body;
      if (!nome || !generos || !data)
        return res.status(400).send({
          mensagem: "Todos os campos obrigatórios devem ser enviados!",
        });
      else {
        await auth()
          .verifyIdToken(authorization.split(" ")[1])
          .then(({ user_id }) => {
            usuario
              .findById(user_id)
              .then(({ _id }) => {
                show
                  .create({
                    idBar: _id, //Dono do show
                    nome,
                    descricao,
                    generos,
                    data,
                    finalizado: false,
                    fechado: false, //Enquanto não tem banda definida para o show
                  })
                  .then((showDB) =>
                    res.json({
                      mensagem: "Show criado com sucesso!",
                      show: showDB,
                    })
                  );
              })
              .catch((e) =>
                res.status(404).send({ mensagem: "Usuário não encontrado!", e })
              );
          })
          .catch((e) =>
            res
              .status(403)
              .send({ mensagem: "Usuário sem permissão!", erro: e })
          );
      }
    } else
      return res.status(403).send({
        mensagem: "Token inválido!",
      });
  } catch (e) {
    res.status(500).send({
      mensagem: "Falha ao processar sua requisição",
    });
  }
};

//Função para editar informações de um determinado show.
exports.editarShow = async (req, res) => {
  try {
    const { authorization } = req.headers;
    if (authorization && authorization.split(" ")[1]) {
      let { nome, descricao, generos, data, idShow } = req.body;
      if (!idShow)
        return res
          .status(404)
          .send({ mensagem: "O id do show não foi informado!" });
      else {
        await auth()
          .verifyIdToken(authorization.split(" ")[1])
          .then(({ uid }) => {
            usuario
              .findById(uid)
              .then(async () => {
                let showDB = await show.findById(idShow);
                if (!showDB)
                  return res.status(404).send({
                    mensagem: "Show não encontrado!",
                  });
                else {
                  if (nome) showDB.set({ nome });
                  if (descricao) showDB.set({ descricao });
                  if (generos) showDB.set({ generos });
                  if (data) showDB.set({ data });
                  showDB
                    .save()
                    .then((showDb) =>
                      res.json({
                        mensagem: "Show alterado com sucesso!",
                        show: showDb,
                      })
                    )
                    .catch((e) =>
                      res.status(404).send({
                        mensagem:
                          "Ocorreu um erro ao tentar salvar suas alterações!",
                        erro: e,
                      })
                    );
                }
              })
              .catch((e) =>
                res
                  .status(404)
                  .send({ mensagem: "Usuário não encontrado!", erro: e })
              );
          })
          .catch((e) =>
            res
              .status(403)
              .send({ mensagem: "Usuário sem permissão!", erro: e })
          );
      }
    } else
      return res.status(403).send({
        mensagem: "Token inválido!",
      });
  } catch (e) {
    console.log("ERROR:", e);
    res.status(500).send({
      mensagem: "Falha ao processar sua requisição",
    });
  }
};

//Função para um bar excluir seu show da lista
exports.excluirShow = async (req, res) => {
  try {
    const idUser = req.headers.iduser;
    const { idShow } = req.body;

    let userDB = await usuario.findById(idUser);

    if (!idUser || userDB.tipo != 1)
      return res.status(403).send({
        mensagem: "Usuário inválido!",
      });
    else {
      let showDB = await show.findById(idShow);
      if (!showDB)
        return res.status(404).send({
          mensagem: "Show não encontrado!",
        });
      else {
        await showDB.remove();
        return res.status(200).send({
          mensagem: "Show excluído com sucesso!",
        });
      }
    }
  } catch (e) {
    console.log("ERROR:", e);
    res.status(500).send({
      mensagem: "Falha ao processar sua requisição",
    });
  }
};

//Função para listar os shows do bar ou que a banda está envolvida
exports.listarShows = async (req, res) => {
  try {
    const { authorization } = req.headers;
    if (authorization && authorization.split(" ")[1]) {
      await auth()
        .verifyIdToken(authorization.split(" ")[1])
        .then(({ user_id }) => {
          usuario
            .findById(user_id)
            .then(({ _id, tipo }) => {
              if (tipo === 1) {
                //Bar
                show
                  .find({ idBar: _id })
                  .then((shows) =>
                    res.json({
                      mensagem:
                        shows.length > 0
                          ? "Shows encontrados!"
                          : "Nenhum show encontrado!",
                      shows,
                    })
                  )
                  .catch((e) =>
                    res.status(404).send({
                      mensagem: "Ocorreu um erro ao tentar buscar seus shows!",
                      erro: e,
                    })
                  );
              } else {
                //Banda
                show
                  .find({
                    $or: [
                      { bandas: { $in: _id } },
                      { bandasAceitas: { $in: _id } },
                      { bandasRejeitadas: { $in: _id } },
                      { idBanda: { $in: _id } },
                    ],
                  })
                  .then((shows) =>
                    res.json({
                      mensagem:
                        shows.length > 0
                          ? "Shows encontrados!"
                          : "Nenhum show encontrado!",
                      shows,
                    })
                  )
                  .catch((e) =>
                    res.status(404).send({
                      mensagem: "Ocorreu um erro ao tentar buscar seus shows!",
                      erro: e,
                    })
                  );
              }
            })
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

//Função para buscar os shows disponíveis para a banda
exports.buscarShows = async (req, res) => {
  try {
    const { authorization } = req.headers;
    if (authorization && authorization.split(" ")[1]) {
      await auth()
        .verifyIdToken(authorization.split(" ")[1])
        .then(({ uid }) => {
          usuario
            .findById(uid)
            .then((usuarioDB) => {
              if (usuarioDB.tipo === 2) {
                const { genero } = req.query;
                let findGeneros;
                if (genero) findGeneros = genero;
                else findGeneros = usuarioDB.generos;
                show
                  .find({
                    $and: [
                      { generos: { $in: findGeneros } },
                      { fechado: false },
                      { bandas: { $ne: uid } },
                      { bandasRejeitadas: { $ne: uid } },
                    ],
                  })
                  .then((shows) =>
                    res.json({
                      mensagem:
                        shows.length > 0
                          ? "Shows encontrados!"
                          : "Nenhum show encontrado!",
                      shows,
                    })
                  )
                  .catch((e) =>
                    res.status(404).send({
                      mensagem: "Ocorreu um erro ao tentar buscar shows!",
                      erro: e,
                    })
                  );
              } else
                res.status(404).send({
                  mensagem: "O tipo de usuário não pode buscar shows!",
                });
            })
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

//Função para alistar uma banda a um show.
exports.alistarBanda = async (req, res) => {
  try {
    const { authorization } = req.headers;
    if (authorization && authorization.split(" ")[1]) {
      const { idShow } = req.body;
      if (!idShow)
        return res.status(400).send({
          mensagem: "Show não informado!",
        });
      else
        await auth()
          .verifyIdToken(authorization.split(" ")[1])
          .then(({ uid }) => {
            usuario
              .findById(uid)
              .then(async () => {
                let showDB = await show.findById(idShow);
                if (!showDB)
                  return res.status(400).send({
                    mensagem: "Show não encontrado!",
                  });
                else {
                  if (
                    showDB.bandas.includes(uid) ||
                    showDB.bandasRejeitadas.includes(uid)
                  ) {
                    return res.status(400).send({
                      mensagem: "Essa banda já se candidatou para esse show!",
                    });
                  } else {
                    showDB.bandas.push(uid);
                    await showDB.save();
                    return res.json({
                      mensagem:
                        "Banda adicionada à fila de bandas com sucesso!",
                      show: showDB,
                    });
                  }
                }
              })
              .catch((e) =>
                res
                  .status(404)
                  .send({ mensagem: "Usuário não encontrado!", erro: e })
              );
          })
          .catch((e) =>
            res
              .status(403)
              .send({ mensagem: "Usuário sem permissão!", erro: e })
          );
    } else
      return res.status(403).send({
        mensagem: "Token inválido!",
      });
  } catch (e) {
    console.log("ERROR:", e);
    res.status(500).send({
      mensagem: "Falha ao processar sua requisição",
    });
  }
};

//Função para banda desistir de um show
exports.desistirShow = async (req, res) => {
  try {
    const { authorization } = req.headers;
    if (authorization && authorization.split(" ")[1]) {
      const { idShow } = req.body;
      if (!idShow)
        return res.status(400).send({
          mensagem: "Show não informado!",
        });
      else
        await auth()
          .verifyIdToken(authorization.split(" ")[1])
          .then(({ uid }) => {
            usuario
              .findById(uid)
              .then(async () => {
                const showDB = await show.findById(idShow);
                if (!showDB)
                  return res.status(404).send({
                    mensagem: "Show não encontrado!",
                  });
                if (showDB.idBanda === uid) showDB.set({ idBanda: null });
                if (showDB.bandas.includes(uid)) showDB.bandas.pull(uid);
                if (showDB.bandasAceitas.includes(uid))
                  showDB.bandasAceitas.pull(uid);
                await showDB.save();
                return res.status(200).send({
                  mensagem: "Alteração salva com sucesso!",
                  show: showDB,
                });
              })
              .catch((e) =>
                res
                  .status(404)
                  .send({ mensagem: "Usuário não encontrado!", erro: e })
              );
          })
          .catch((e) =>
            res
              .status(403)
              .send({ mensagem: "Usuário sem permissão!", erro: e })
          );
    } else
      return res.status(403).send({
        mensagem: "Token inválido!",
      });
  } catch (e) {
    console.log("ERROR:", e);
    res.status(500).send({
      mensagem: "Falha ao processar sua requisição",
    });
  }
};

//Traz detalhes de uma ou mais bandas para o usuário
exports.detalhesBandas = async (req, res) => {
  try {
    const { authorization } = req.headers;
    if (authorization && authorization.split(" ")[1]) {
      let { bandas } = req.body;
      if (!bandas)
        return res.status(400).send({
          mensagem: "Bandas não informadas!",
        });
      else
        await auth()
          .verifyIdToken(authorization.split(" ")[1])
          .then(({ user_id }) => {
            usuario
              .findById(user_id)
              .then(() => {
                usuario.find({ _id: { $in: bandas } }).then((bandasDB) =>
                  res.json({
                    mensagem:
                      bandasDB.length > 0
                        ? "Bandas encontradas"
                        : "Nenhuma banda encontrada",
                    bandas: bandasDB,
                  })
                );
              })
              .catch((e) =>
                res
                  .status(404)
                  .send({ mensagem: "Usuário não encontrado!", erro: e })
              );
          })
          .catch((e) =>
            res
              .status(403)
              .send({ mensagem: "Usuário sem permissão!", erro: e })
          );
    } else
      return res.status(403).send({
        mensagem: "Token inválido!",
      });
  } catch (e) {
    console.log("ERROR:", e);
    res.status(500).send({
      mensagem: "Falha ao processar sua requisição",
    });
  }
};

//Avaliação do show de 1 a 5 (Sistema de estrelas), feita primeiro pelo bar para finalizar o show e depois pela banda
exports.avaliarShow = async (req, res) => {
  try {
    const { authorization } = req.headers;
    if (authorization && authorization.split(" ")[1]) {
      let { avaliacao, idShow } = req.body;
      if (!avaliacao || isNaN(avaliacao) || avaliacao > 5 || avaliacao < 1)
        return res.status(400).send({
          mensagem: "Avaliação inválida!",
        });
      else if (!idShow)
        return res.status(400).send({
          mensagem: "Show não informado!",
        });
      else
        await auth()
          .verifyIdToken(authorization.split(" ")[1])
          .then(({ user_id }) => {
            usuario
              .findById(user_id)
              .then(async () => {
                let showDB = await show.findById(idShow);
                if (!showDB)
                  return res.status(400).send({
                    mensagem: "Show não encontrado!",
                  });
                else {
                  if (showDB.idBar === user_id) {
                    if (showDB.avaliacaoBanda)
                      return res.status(400).send({
                        mensagem: "Show já avaliado por este usuário!",
                      });
                    else {
                      showDB.finalizado = true;
                      showDB.avaliacaoBanda = avaliacao;
                      let bandaDB = await usuario.findById(showDB.idBanda);
                      let avaliacoesBanda = bandaDB.avaliacoes;
                      avaliacoesBanda.push(avaliacao);
                      bandaDB.avaliacao =
                        avaliacoesBanda.reduce((a, b) => a + b, 0) /
                        avaliacoesBanda.length;
                      await showDB.save();
                      await bandaDB.save();
                      return res.json({
                        mensagem: "Avaliação salva com sucesso!",
                        show: showDB,
                      });
                    }
                  } else if (showDB.idBanda === user_id) {
                    if (showDB.avaliacaoBar)
                      return res.status(400).send({
                        mensagem: "Show já avaliado por este usuário!",
                      });
                    else if (!showDB.finalizado)
                      return res.status(400).send({
                        mensagem:
                          "O dono do show ainda não encerrou esse evento!",
                      });
                    else {
                      showDB.avaliacaoBar = avaliacao;
                      let barDB = await usuario.findById(showDB.idBar);
                      let avaliacoesBar = barDB.avaliacoes;
                      avaliacoesBar.push(avaliacao);
                      barDB.avaliacao =
                        avaliacoesBar.reduce((a, b) => a + b, 0) /
                        avaliacoesBar.length;
                      await showDB.save();
                      await barDB.save();
                      return res.json({
                        mensagem: "Avaliação salva com sucesso!",
                        show: showDB,
                      });
                    }
                  } else
                    return res.status(400).send({
                      mensagem: "Usuário não cadastrado nesse show!",
                    });
                }
              })
              .catch((e) =>
                res
                  .status(404)
                  .send({ mensagem: "Usuário não encontrado!", erro: e })
              );
          })
          .catch((e) =>
            res
              .status(403)
              .send({ mensagem: "Usuário sem permissão!", erro: e })
          );
    } else
      return res.status(403).send({
        mensagem: "Token inválido!",
      });
  } catch (e) {
    console.log("ERROR:", e);
    res.status(500).send({
      mensagem: "Falha ao processar sua requisição",
    });
  }
};

//Rota para o bar aceitar e rejeitar bandas
exports.escolherBandas = async (req, res) => {
  try {
    const { authorization } = req.headers;
    if (authorization && authorization.split(" ")[1]) {
      const { idShow, aceitas, rejeitadas } = req.body;
      if (!idShow)
        return res.status(400).send({
          mensagem: "Show não informado!",
        });
      else
        await auth()
          .verifyIdToken(authorization.split(" ")[1])
          .then(() => {
            show
              .findById(idShow)
              .then(async (showDB) => {
                if (!showDB)
                  return res.status(400).send({
                    mensagem: "Show não encontrado!",
                    show: showDB,
                  });
                else {
                  if (aceitas && aceitas.length > 0)
                    aceitas.forEach((banda) => {
                      if (
                        showDB.bandas &&
                        showDB.bandas.length > 0 &&
                        showDB.bandas.includes(banda)
                      )
                        showDB.bandas = showDB.bandas.filter(
                          (b) => b !== banda
                        );
                      if (
                        showDB.bandasRejeitadas &&
                        showDB.bandasRejeitadas.length &&
                        showDB.bandasRejeitadas.includes(banda)
                      )
                        showDB.bandasRejeitadas = showDB.bandasRejeitadas.filter(
                          (b) => b !== banda
                        );
                      showDB.bandasAceitas.push(banda);
                    });

                  if (rejeitadas && rejeitadas.length > 0)
                    rejeitadas.forEach((banda) => {
                      if (
                        showDB.bandas &&
                        showDB.bandas.length > 0 &&
                        showDB.bandas.includes(banda)
                      )
                        showDB.bandas = showDB.bandas.filter(
                          (b) => b !== banda
                        );
                      if (
                        showDB.bandasAceitas &&
                        showDB.bandasAceitas.length > 0 &&
                        showDB.bandasAceitas.includes(banda)
                      )
                        showDB.bandasAceitas = showDB.bandasAceitas.filter(
                          (b) => b !== banda
                        );
                      if (showDB.idBanda === banda) {
                        showDB.fechado = false;
                        showDB.idBanda = "";
                      }
                      showDB.bandasRejeitadas.push(banda);
                    });

                  await showDB.save();
                  return res.json({
                    mensagem: "Bandas escolhidas com sucesso!",
                    show: showDB,
                  });
                }
              })
              .catch((e) => {
                console.log("ERROR:", e);
                res
                  .status(404)
                  .send({ mensagem: "Show não encontrado!", erro: e });
              });
          })
          .catch((e) =>
            res
              .status(403)
              .send({ mensagem: "Usuário sem permissão!", erro: e })
          );
    } else
      return res.status(403).send({
        mensagem: "Token inválido!",
      });
  } catch (e) {
    console.log("ERROR:", e);
    res.status(500).send({
      mensagem: "Falha ao processar sua requisição",
    });
  }
};

//Rota para o bar escolher a banda
exports.escolherBanda = async (req, res) => {
  try {
    const { authorization } = req.headers;
    if (authorization && authorization.split(" ")[1]) {
      const { idShow, idBanda } = req.body;
      if (!idShow)
        return res.status(400).send({
          mensagem: "Show não informado!",
        });
      if (!idBanda)
        return res.status(400).send({
          mensagem: "Banda não informada!",
        });
      else
        await auth()
          .verifyIdToken(authorization.split(" ")[1])
          .then(() => {
            show
              .findById(idShow)
              .then(async (showDB) => {
                if (!showDB)
                  return res.status(400).send({
                    mensagem: "Show não encontrado!",
                  });
                else {
                  if (showDB.bandasAceitas.includes(idBanda)) {
                    showDB.bandasAceitas = showDB.bandasAceitas.filter(
                      (b) => b !== idBanda
                    );
                    if (showDB.idBanda)
                      showDB.bandasAceitas.push(showDB.idBanda);
                    showDB.idBanda = idBanda;
                    showDB.fechado = true;
                    await showDB.save();
                    return res.json({
                      mensagem: "Banda definida com sucesso!",
                      show: showDB,
                    });
                  } else
                    return res.status(400).send({
                      mensagem:
                        "Uma banda precisa ser aceita antes de ser escolhida!",
                    });
                }
              })
              .catch((e) =>
                res
                  .status(404)
                  .send({ mensagem: "Show não encontrado!", erro: e })
              );
          })
          .catch((e) =>
            res
              .status(403)
              .send({ mensagem: "Usuário sem permissão!", erro: e })
          );
    } else
      return res.status(403).send({
        mensagem: "Token inválido!",
      });
  } catch (e) {
    console.log("ERROR:", e);
    res.status(500).send({
      mensagem: "Falha ao processar sua requisição",
    });
  }
};
