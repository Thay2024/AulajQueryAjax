$(document).ready(function() {
    // --- DADOS E VARIÁVEIS DE ESTADO ---

    // ALTERADO: A lista de usuários voltou. Ela será usada APENAS para a validação do LOGIN.
    const usuariosLogin = [
        { id: 1, nome: "Raquel", email: "raquel@gmail.com", cargo: "Administrador", senha: "admin123" },
        { id: 2, nome: "Beatriz", email: "bia@gmail.com", cargo: "Supervisor", senha: "super123" },
        { id: 3, nome: "Carmem", email: "carmem@gmail.com", cargo: "Especialista", senha: "espec123" }
    ];

    // Variáveis para guardar o estado do usuário logado
    let cargoLogado = "";
    let idUsuarioLogado = null;

    // --- FUNÇÕES DE MENSAGEM (sem alteração) ---
    function mensagem(msg, isError = false) {
        $("#mensagemLogin").text(msg).toggleClass("error", isError);
        setTimeout(() => $("#mensagemLogin").text(""), 3000);
    }
    function mensagemCadastro(msg, isError = false) {
        $("#mensagemCadastro").text(msg).toggleClass("error", isError);
        setTimeout(() => $("#mensagemCadastro").text(""), 3000);
    }

    // --- LÓGICA DE LOGIN E LOGOUT ---

    // Função de Login (REVERTIDO para o método simples e funcional)
  // Função de Login (CORRIGIDA para buscar o ID real da API após a validação)
$("#loginForm").submit(function(evento) {
    evento.preventDefault();
    const usuarioInput = $("#usuario").val();
    const senhaInput = $("#senha").val();

    // Passo 1: Valida o login na lista interna para checar a senha (simulação)
    const usuarioLoginInfo = usuariosLogin.find(u => u.nome === usuarioInput && u.senha === senhaInput);

    if (usuarioLoginInfo) {
        // Passo 2: Login local bem-sucedido. AGORA, buscamos o usuário na API para pegar seu ID REAL.
        $.ajax({
            url: `http://localhost:3000/usuarios?nome=${usuarioLoginInfo.nome}`,
            method: 'GET',
            success: function(apiUsuarios) {
                if (apiUsuarios && apiUsuarios.length > 0) {
                    const usuarioReal = apiUsuarios[0];

                    // Passo 3: Armazena o CARGO do login e o ID REAL da API.
                    cargoLogado = usuarioLoginInfo.cargo; // O cargo vem da lista de login (fonte da verdade p/ permissão)
                    idUsuarioLogado = usuarioReal.id;     // O ID vem da API (fonte da verdade p/ dados)

                    // Agora que temos o ID real e sincronizado, podemos prosseguir.
                    $("#loginSection").hide();
                    $("#cadastroSection, #usuariosSection").show();
                    $("#formUser")[0].reset();
                    $("#idUsuario").val("");
                    $("h2", "#cadastroSection").text("Cadastro de Usuário");
                    $("#cadastroSection button[type='submit']").text("Cadastrar");
                    listarUsuarios();
                } else {
                    mensagem(`Usuário '${usuarioLoginInfo.nome}' não encontrado na API. Verifique se o db.json está correto.`, true);
                }
            },
            error: function() {
                mensagem("Erro ao conectar com a API para finalizar o login.", true);
            }
        });
    } else {
        mensagem("Usuário ou senha incorretos!", true);
    }
});

    // Função de Logout (sem alteração)
    $(document).on("click", ".btnSair", function() {
        cargoLogado = "";
        idUsuarioLogado = null;
        $("#cadastroSection, #usuariosSection").hide();
        $("#usuario").val("");
        $("#senha").val("");
        $("#mensagemLogin").text("").removeClass("error");
        $("#loginSection").show();
    });

    // --- FUNÇÕES DE CRUD (TODAS USANDO AJAX, CONECTADAS À SUA API) ---

    // Função para LISTAR usuários (busca os dados da API)
    function listarUsuarios() {
        $.ajax({
            url: 'http://localhost:3000/usuarios',
            method: 'GET',
            success: function(dado) {
                // A lógica de permissão é aplicada sobre os dados vindos da API
                let usuariosParaExibir = dado;
                let cabecalhoHtml = "";

                if (cargoLogado === 'Especialista') {
                    usuariosParaExibir = dado.filter(u => u.id == idUsuarioLogado);
                }
                if (cargoLogado === 'Supervisor') {
                    cabecalhoHtml = `<tr><th>Nome</th><th>Cargo</th><th>Ações</th></tr>`;
                } else {
                    cabecalhoHtml = `<tr><th>Nome</th><th>Email</th><th>Cargo</th><th>Ações</th></tr>`;
                }
                let corpoHtml = "";
                usuariosParaExibir.forEach(usuario => {
                    let acoes = "";
                    if (cargoLogado === "Administrador") {
                        acoes = `<button class="btnEditar" data-id="${usuario.id}">Editar</button> <button class="btnExcluir" data-id="${usuario.id}">Excluir</button>`;
                    } else if (usuario.id == idUsuarioLogado) {
                        acoes = `<button class="btnEditar" data-id="${usuario.id}">Editar</button> <button class="btnExcluir" disabled>Excluir</button>`;
                    } else {
                        acoes = `<button class="btnEditar" disabled>Editar</button> <button class="btnExcluir" disabled>Excluir</button>`;
                    }
                    let colunas = "";
                    if (cargoLogado === 'Supervisor') {
                        colunas = `<td>${usuario.nome}</td><td>${usuario.cargo}</td>`;
                    } else {
                        colunas = `<td>${usuario.nome}</td><td>${usuario.email}</td><td>${usuario.cargo}</td>`;
                    }
                    corpoHtml += `<tr>${colunas}<td>${acoes}</td></tr>`;
                });
                $("#usuariosSection table thead").html(cabecalhoHtml);
                $("#listaUsuarios").html(corpoHtml);
            },
            error: function() {
                mensagemCadastro("Erro ao carregar a lista de usuários da API.", true);
            }
        });
    }

    // Função para CADASTRAR ou EDITAR usuários (envia dados para a API)
    $("#formUser").submit(function(evento) {
        evento.preventDefault();
        const nome = $("#nome").val();
        const email = $("#email").val();
        const cargo = $("#cargo").val();
        const id = $("#idUsuario").val();

        const dadoUsuario = { nome, email, cargo };
        let url = 'http://localhost:3000/usuarios';
        let method = 'POST';

        if (id) {
            url += `/${id}`;
            method = 'PUT';
        }

        $.ajax({
            url: url,
            method: method,
            contentType: 'application/json',
            data: JSON.stringify(dadoUsuario),
            success: function() {
                mensagemCadastro(id ? "Usuário atualizado com sucesso!" : "Usuário cadastrado com sucesso!");
                $("#formUser")[0].reset();
                $("#idUsuario").val("");
                $("h2", "#cadastroSection").text("Cadastro de Usuário");
                $("#cadastroSection button[type='submit']").text("Cadastrar");
                listarUsuarios(); // Recarrega a lista da API para mostrar as alterações
            },
            error: function() {
                mensagemCadastro(id ? "Erro ao atualizar usuário." : "Erro ao cadastrar usuário.", true);
            }
        });
    });

    // Evento para o botão EDITAR (busca dados do usuário específico da API)
    // Evento EDITAR (agora vai funcionar corretamente com o ID real)
$(document).on("click", ".btnEditar", function() {
    const id = $(this).data("id");
    $.ajax({
        url: `http://localhost:3000/usuarios/${id}`,
        method: 'GET',
        success: function(usuario) {
            if (cargoLogado === "Administrador" || usuario.id == idUsuarioLogado) {
                $("#nome").val(usuario.nome);
                $("#email").val(usuario.email);
                $("#cargo").val(usuario.cargo);
                $("#idUsuario").val(usuario.id);
                $("h2", "#cadastroSection").text("Editar Usuário");
                $("#cadastroSection button[type='submit']").text("Salvar Alterações");
                $('html, body').animate({ scrollTop: $("#cadastroSection").offset().top }, 500);
            } else {
                mensagemCadastro("Você não tem permissão para editar este usuário.", true);
            }
        },
        error: function() {
            mensagemCadastro("Erro ao carregar dados do usuário para edição.", true);
        }
    });
});

    // Evento para o botão EXCLUIR (envia requisição de exclusão para a API)
    $(document).on("click", ".btnExcluir", function() {
        const id = $(this).data("id");
        if (confirm("Tem certeza que deseja excluir este usuário?")) {
            $.ajax({
                url: `http://localhost:3000/usuarios/${id}`,
                method: 'DELETE',
                success: function() {
                    mensagemCadastro("Usuário excluído com sucesso!");
                    listarUsuarios(); // Recarrega a lista da API para refletir a exclusão
                },
                error: function() {
                    mensagemCadastro("Erro ao excluir usuário.", true);
                }
            });
        }
    });
});