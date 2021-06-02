const { Schema, model } = require("mongoose");

const showSchema = new Schema(
  {
    idBar: {
      type: String,
      required: true,
    },
    nome: {
      type: String,
      required: true,
    },
    generos: {
      type: Array,
      required: true,
    },
    data: {
      type: Date,
      required: true,
    },
    descricao: String,
    idBanda: String, //Banda alistada será registrada aqui
    bandas: Array, //Bandas que querem fazer o show
    bandasAceitas: Array, //Bandas que foram selecionadas pelo bar
    bandasRejeitadas: Array, //Bandas rejeitadas pelo bar
    fechado: Boolean, //Está marcado
    finalizado: Boolean, //Se já aconteceu
    avaliacaoBar: Number, //Avaliação que a banda deu para o bar
    avaliacaoBanda: Number, //Avaliação que o bar deu para a banda
  },
  {
    timestamps: true,
  }
);
module.exports = model("show", showSchema);
