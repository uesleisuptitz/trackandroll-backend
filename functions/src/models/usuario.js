const { Schema, model } = require("mongoose");

const usuarioSchema = new Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    nome: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    contato: {
      type: String,
      required: true,
    },
    tipo: {
      type: Number,
      required: true,
    },
    avaliacao: Number,
    avaliacoes: Array,
    //Somente bar tem:
    endereco: String,
    infraestrutura: String,
    //Somente banda tem:
    generos: Array,
    equipamentos: Array,
    repertorio: Array,
    integrantes: Array,
  },
  {
    timestamps: true,
  }
);
module.exports = model("usuario", usuarioSchema);
