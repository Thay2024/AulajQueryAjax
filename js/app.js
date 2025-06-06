$(document).ready(function() {
    // --- DADOS E VARIÁVEIS DE ESTADO ---

    // Lista de usuários usada APENAS para a validação do LOGIN.
    const usuariosLogin = [
        { id: 1, nome: "Raquel", email: "raquel@gmail.com", cargo: "Administrador", senha: "admin123" },
        { id: 2, nome: "Beatriz", email: "bia@gmail.com", cargo: "Supervisor", senha: "super123" },
        { id: 3, nome: "Carmem", email: "carmem@gmail.com", cargo: "Especialista", senha: "espec123" }
    ];

    let cargoLogado = "";
    let idUsuarioLogado = null;

    // --- FUNÇÕES DE MENSAGEM ---
    function mensagem(msg, isError = false) {
        $("#mensagemLogin").text(msg).toggleClass("error", isError);
        setTimeout(() => $("#mensagemLogin").text(""), 5000); // Aumentei o tempo da mensagem
    }
    function mensagemCadastro(msg, isError = false) {
        $("#mensagemCadastro").text(msg).toggleClass("error", isError);
        setTimeout(() => $("#mensagemCadastro").text(""), 3000);
    }

    // --- LÓGICA DE LOGIN, LOGOUT E AUTO-CADASTRO ---

    // NOVO: Evento de clique para o botão "Cadastrar Usuário" na tela de login
    $("#cadastroLink").on("click", function() {
        $("#loginSection").hide();
        
        // Prepara o formulário para um novo cadastro
        $("#formUser")[0].reset();
        $("#idUsuario").val("");
        $("h2", "#cadastroSection").text("Cadastro de Novo Usuário");
        $("#cadastroSection button[type='submit']").text("Cadastrar");
        
        $("#cadastroSection").show();
    });

    // Função de Login
    $("#loginForm").submit(function(evento) {
        evento.preventDefault();
        const usuarioInput = $("#usuario").val();
        const senhaInput = $("#senha").val();
        const usuarioLoginInfo = usuariosLogin.find(u => u.nome === usuarioInput && u.senha === senhaInput);

        if (usuarioLoginInfo) {
            $.ajax({
                url: `http://localhost:3000/usuarios?nome=${usuarioLoginInfo.nome}`,
                method: 'GET',
                success: function(apiUsuarios) {
                    if (apiUsuarios && apiUsuarios.length > 0) {
                        const usuarioReal = apiUsuarios[0];
                        cargoLogado = usuarioLoginInfo.cargo;
                        idUsuarioLogado = usuarioReal.id;
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

    // Função de Logout (Sair)
    $(document).on("click", ".btnSair", function() {
        cargoLogado = "";
        idUsuarioLogado = null;
        $("#cadastroSection, #usuariosSection").hide();
        $("#usuario").val("");
        $("#senha").val("");
        $("#mensagemLogin").text("").removeClass("error");
        $("#loginSection").show();
    });

    // --- FUNÇÕES DE CRUD ---

    // Função para LISTAR usuários
    function listarUsuarios() {
        $.ajax({
            url: 'http://localhost:3000/usuarios',
            method: 'GET',
            success: function(dado) {
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

    // Função para CADASTRAR ou EDITAR usuários (ALTERADO para lidar com os dois fluxos)
    $("#formUser").submit(function(evento) {
        evento.preventDefault();
        const nome = $("#nome").val();
        const email = $("#email").val();
        const cargo = $("#cargo").val();
        const id = $("#idUsuario").val();

        // Para auto-cadastro, o cargo padrão será "Especialista" se não houver usuário logado
        const cargoFinal = cargoLogado ? cargo : "Especialista";

        const dadoUsuario = { nome, email, cargo: cargoFinal };
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
                if (cargoLogado) {
                    // FLUXO 1: Usuário logado (ADM) criou/editou alguém.
                    mensagemCadastro(id ? "Usuário atualizado com sucesso!" : "Usuário cadastrado com sucesso!");
                    $("#formUser")[0].reset();
                    $("#idUsuario").val("");
                    $("h2", "#cadastroSection").text("Cadastro de Usuário");
                    $("#cadastroSection button[type='submit']").text("Cadastrar");
                    listarUsuarios();
                } else {
                    // FLUXO 2: Novo usuário se cadastrou.
                    $("#cadastroSection").hide();
                    $("#formUser")[0].reset();
                    $("#loginSection").show();
                    mensagem("Cadastro realizado com sucesso! Por favor, faça o login.", false);
                }
            },
            error: function() {
                mensagemCadastro(id ? "Erro ao atualizar usuário." : "Erro ao cadastrar usuário.", true);
            }
        });
    });

    // Evento para o botão EDITAR
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

    // Evento para o botão EXCLUIR
    $(document).on("click", ".btnExcluir", function() {
        const id = $(this).data("id");
        if (confirm("Tem certeza que deseja excluir este usuário?")) {
            $.ajax({
                url: `http://localhost:3000/usuarios/${id}`,
                method: 'DELETE',
                success: function() {
                    mensagemCadastro("Usuário excluído com sucesso!");
                    listarUsuarios();
                },
                error: function() {
                    mensagemCadastro("Erro ao excluir usuário.", true);
                }
            });
        }
    });
});