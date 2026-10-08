import "./RetiradaPresencial.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaSearch,
  FaTimes,
  FaInbox,
  FaPencilAlt,
} from "react-icons/fa";
import { listarRegistros } from "../../services/registrosService";

function RetiradaPresencial() {
  const navigate = useNavigate();
  const [registros, setRegistros] = useState([]);
  const [colaboradorSelecionado, setColaboradorSelecionado] = useState(null);
  // Busca (Nome ou CPF)
  const [tipoBusca, setTipoBusca] = useState("nome");
  const [busca, setBusca] = useState("");
  // Formulário do Painel Lateral
  const [retirado, setRetirado] = useState(false); // false = Não, true = Sim
  const [porTipo, setPorTipo] = useState("Colaborador"); // 'Colaborador', 'Outro', 'Malote'
  const [nomePessoa, setNomePessoa] = useState("");
  const [cpfPessoa, setCpfPessoa] = useState("");
  const [maloteDestino, setMaloteDestino] = useState("");
  const [novoFazer, setNovoFazer] = useState(null);

  const carregarRegistros = async () => {
    const dados = await listarRegistros();
    // Filtra colaboradores marcados para 'Retirar'
    const retiradas = (dados || []).filter(
      (r) => r.fazer?.toLowerCase() === "retirar"
    );
    setRegistros(retiradas);
  };

  useEffect(() => {
    carregarRegistros();
  }, []);

  const abrirPainelColaborador = (colab) => {
    setColaboradorSelecionado(colab);
    setRetirado(false);
    setPorTipo("Colaborador");
    setNomePessoa("");
    setCpfPessoa("");
    setMaloteDestino("");
    setNovoFazer(null);
  };

  // Abre correspondência no Outlook (mailto) com a mensagem de retirada
  const abrirEmailRetirada = () => {
    const colab = colaboradorSelecionado;
    if (!colab) return;

    const emailDestino = colab.email || colab.email_pessoal;
    if (!emailDestino) return;

    const dataHoje = new Date().toLocaleDateString("pt-BR");
    const nomeColab = colab.nome_completo;
    const beneficio = colab.beneficio || "benefício";

    let textoRetirada = "";
    if (porTipo === "Colaborador") {
      textoRetirada = `foi retirado por você no dia ${dataHoje}.`;
    } else if (porTipo === "Outro") {
      const quemRetirou = nomePessoa.trim() || "outra pessoa";
      const doc = cpfPessoa.trim()
        ? `, portador(a) do documento ${cpfPessoa.trim()}`
        : "";
      textoRetirada = `foi retirado no dia ${dataHoje} por ${quemRetirou}${doc}.`;
    } else if (porTipo === "Malote") {
      const destino = maloteDestino || "o destino informado";
      textoRetirada = `foi postado via malote para o prédio ${destino} no dia ${dataHoje}. Pedimos que procure pela expedição do prédio após 3 dias para realizar a retirada. `;
    }

    const assunto = "Seu benefício foi retirado";

    const corpo =
      `Prezado(a) ${nomeColab},\n\n` +
      `Informamos que seu benefício (${beneficio}) ${textoRetirada}\n\n` +
      `Caso tenha alguma dúvida, estamos à disposição.\n\n` +
      `Atenciosamente,\n` +
      `Departamento de RH`;

      
    const emailCopia = "camila.barros@globalhitss.com.br, erica.silva@globalhitss.com.br, renata.nunes@globalhitss.com.br"; 

    const mailtoUrl =
      `mailto:${emailDestino}` +
      `?subject=${encodeURIComponent(assunto)}` +
      `&cc=${encodeURIComponent(emailCopia)}` +
      `&body=${encodeURIComponent(corpo)}`;

    const linkMailto = document.createElement("a");
    linkMailto.href = mailtoUrl;
    linkMailto.click();
  };

  const alternarBusca = () => {
    setBusca("");
    setTipoBusca(tipoBusca === "nome" ? "cpf" : "nome");
  };

  // Filtrar lista por Nome ou CPF
  const registrosFiltrados = registros.filter((reg) => {
    if (!busca.trim()) return true;
    const termo = busca.trim().toLowerCase();
    if (tipoBusca === "nome") {
      return reg.nome_completo?.toLowerCase().includes(termo);
    } else {
      // Busca específica pelo CPF
      const cpfColaborador = reg.cpf?.toString().toLowerCase() || "";
      const cpfRetirada = reg.retirado_cpf?.toString().toLowerCase() || "";
      return cpfColaborador.includes(termo) || cpfRetirada.includes(termo);
    }
  });

  const podeSalvar = retirado || novoFazer === "Postar";

  const salvarRetirada = async () => {
    if (!colaboradorSelecionado) return;
    const dataSaidaHoje = retirado
      ? new Date().toLocaleDateString("pt-BR")
      : null;
    try {
      await fetch(
        `http://localhost:3001/registros/${colaboradorSelecionado.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fazer:
              novoFazer === "Postar"
                ? "Postar"
                : retirado
                ? "Retirado"
                : "Retirar",
            data_saida: dataSaidaHoje,
            retirado_tipo: porTipo,
            retirado_nome: nomePessoa,
            retirado_cpf: cpfPessoa,
            retirado_malote: maloteDestino,
          }),
        }
      );

      // Abre a correspondência no Outlook após salvar (apenas se houve retirada)
      if (retirado) {
        abrirEmailRetirada();
      }

      alert(
        retirado
          ? "Retirada presencial registrada com sucesso!"
          : "Alterações salvas com sucesso!"
      );

      setColaboradorSelecionado(null);
      carregarRegistros();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar retirada.");
    }
  };

  return (
    <div className="retirada-presencial-page">
      <header className="retirada-header">
        <button className="btn-voltar" onClick={() => navigate("/menu-retirada")}>
          <FaArrowLeft />
        </button>
        <h1>Retirada</h1>
      </header>
      <div className="retirada-presencial-content">
        {/* LADO ESQUERDO */}
        <div className="lado-esquerdo-presencial">
          {/* ÁREA SUPERIOR DE BUSCA */}
          <div className="area-busca-presencial">
            <h2>{tipoBusca === "nome" ? "Nome" : "CPF"}</h2>
            <div className="search-box">
              <div className="input-wrapper">
                <input
                  type="text"
                  placeholder={
                    tipoBusca === "nome"
                      ? "Digite aqui o nome do colaborador"
                      : "Digite aqui o CPF do colaborador"
                  }
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
                {busca && (
                  <button className="btn-limpar" onClick={() => setBusca("")}>
                    <FaTimes />
                  </button>
                )}
              </div>
              <button className="btn-pesquisar">
                <FaSearch />
              </button>
            </div>
            <p className="trocar-busca" onClick={alternarBusca}>
              {tipoBusca === "nome"
                ? "Ou clique aqui para pesquisar pelo CPF"
                : "Ou clique aqui para pesquisar pelo Nome"}
            </p>
          </div>
          {/* ÁREA AZULADA DE CARDS */}
          <div className="area-azulada-cards">
            <div className="scroll-cards-presencial">
              {registrosFiltrados.map((item) => {
                const isSelected =
                  colaboradorSelecionado &&
                  colaboradorSelecionado.id === item.id;
                return (
                  <div
                    key={item.id}
                    className={`card-presencial-item ${
                      isSelected ? "selecionado" : ""
                    }`}
                    onClick={() => abrirPainelColaborador(item)}
                  >
                    <div className="card-info-top">
                      <strong>{item.nome_completo}</strong>
                    </div>
                    <p className="card-chegou">Chegou: {item.data_chegada}</p>
                    <p className="card-beneficio">{item.beneficio}</p>
                    <div className="icone-lapis">
                      <FaPencilAlt />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {/* LADO DIREITO (PAINEL VERMELHO COM CARD BRANCO) */}
        <div className="lado-direito-presencial">
          {!colaboradorSelecionado ? (
            <div className="painel-vazio">
              <h2>Você ainda não selecionou nenhum colaborador</h2>
              <div className="icone-inbox-wrapper">
                <FaInbox />
              </div>
            </div>
          ) : (
            <div className="painel-card-presencial">
              {/* CABEÇALHO DO CARD */}
              <div className="topo-card-info">
                <h3>
                  {colaboradorSelecionado.nome_completo}{" "}
                  <span className="divisor-empresa">
                    | {colaboradorSelecionado.empresa}
                  </span>
                </h3>
                <p>Chegou: {colaboradorSelecionado.data_chegada}</p>
                <p>Benefício: {colaboradorSelecionado.beneficio}</p>
              </div>
              <hr className="linha-divisoria" />
              {/* PERGUNTA E TOGGLE */}
              <div className="secao-retirada-form">
                <p className="pergunta-retirada">O benefício foi retirado?</p>
                <div className="switch-container">
                  <div
                    className={`switch-slider ${retirado ? "direita" : ""}`}
                  ></div>
                  <button
                    className={`switch-option ${!retirado ? "ativo-slider" : ""}`}
                    onClick={() => {
                      setRetirado(false);
                      setPorTipo("Colaborador");
                      setNomePessoa("");
                      setCpfPessoa("");
                      setMaloteDestino("");
                    }}
                  >
                    Não
                  </button>
                  <button
                    className={`switch-option ${retirado ? "ativo-slider" : ""}`}
                    onClick={() => {
                      setRetirado(true);
                      setNovoFazer(null);
                    }}
                  >
                    Sim
                  </button>
                </div>
                {/* OPÇÕES ADICIONAIS CASO "SIM" SEJA SELECIONADO */}
                {retirado && (
                  <div className="sub-opcoes-retirada">
                    <p className="legenda-por">por:</p>
                    <div className="pills-por-container">
                      <button
                        className={`pill-opcao ${
                          porTipo === "Colaborador" ? "ativo" : ""
                        }`}
                        onClick={() => {
                          setPorTipo("Colaborador");
                          setCpfPessoa("");
                        }}
                      >
                        Colaborador
                      </button>
                      <button
                        className={`pill-opcao ${
                          porTipo === "Outro" ? "ativo" : ""
                        }`}
                        onClick={() => {
                          setPorTipo("Outro");
                        }}
                      >
                        Outro
                      </button>
                      <button
                        className={`pill-opcao ${
                          porTipo === "Malote" ? "ativo" : ""
                        }`}
                        onClick={() => {
                          setPorTipo("Malote");
                        }}
                      >
                        Malote
                      </button>
                    </div>
                    {/* CAMPOS DEPENDENDO DO TIPO SELECIONADO */}
                    {/* "Colaborador" não exibe mais campo de CPF (retirada pelo próprio colaborador) */}
                    {porTipo === "Outro" && (
                      <div className="campo-grupo">
                        <label>Nome:</label>
                        <input
                          type="text"
                          placeholder="Digite o nome da pessoa"
                          value={nomePessoa}
                          onChange={(e) => {
                            setNomePessoa(e.target.value);
                          }}
                        />
                        <label style={{ marginTop: "10px" }}>CPF:</label>
                        <input
                          type="text"
                          placeholder="Digite o CPF da pessoa"
                          value={cpfPessoa}
                          onChange={(e) => {
                            setCpfPessoa(e.target.value);
                          }}
                        />
                      </div>
                    )}
                    {porTipo === "Malote" && (
                      <div className="campo-grupo">
                        <label>Para onde?</label>
                        <select
                          value={maloteDestino}
                          onChange={(e) => {
                            setMaloteDestino(e.target.value);
                          }}
                        >
                          <option value="">Selecione uma opção</option>
                          <option value="Ingleses">Ingleses</option>
                          <option value="Henri Dunant">Henri Dunant</option>
                          <option value="Verbo Divino">Verbo Divino</option>
                          <option value="Bernardino">Bernardino</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {!retirado && (
                <div className="secao-mudar-opcao">
                  <p className="pergunta-mudar">
                    Esse benefício não era para ser retirado?
                    <br />
                    Mude para a opção "Postar"
                  </p>
                  <button
                    className={`btn-opcao-postar ${
                      novoFazer === "Postar" ? "selecionado" : ""
                    }`}
                    onClick={() => {
                      setNovoFazer(
                        novoFazer === "Postar" ? null : "Postar"
                      );
                    }}
                  >
                    Postar
                  </button>
                </div>
              )}
              {/* BOTÃO SALVAR FIXO NO CANTO INFERIOR DIREITO */}
              <div className="area-btn-salvar-presencial">
                <button
                  className={`btn-salvar-presencial ${
                    podeSalvar ? "ativo" : "desativado"
                  }`}
                  disabled={!podeSalvar}
                  onClick={salvarRetirada}
                >
                  Salvar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RetiradaPresencial;