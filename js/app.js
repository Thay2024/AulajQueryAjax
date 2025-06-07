$(document).ready(function() {
    // --- O ARRAY DE LOGIN FOI REMOVIDO! A validação agora é 100% via API ---

    // Variáveis para guardar o estado do usuário logado
    let cargoLogado = "";
    let idUsuarioLogado = null;

    // --- FUNÇÕES DE MENSAGEM ---
    function mensagem(msg, isError = false) {
        $("#mensagemLogin").text(msg).toggleClass("error", isError);
        setTimeout(() => $("#mensagemLogin").text(""), 5000);
    }
    function mensagemCadastro(msg, isError = false) {
        $("#mensagemCadastro").text(msg).toggleClass("error", isError);
        setTimeout(() => $("#mensagemCadastro").text(""), 3000);
    }

    // --- LÓGICA DE LOGIN, LOGOUT E AUTO-CADASTRO ---

    // Evento de clique para o botão "Cadastrar Usuário"
    $("#cadastroLink").on("click", function() {
        $("#loginSection").hide();
        $("#formUser")[0].reset();
        $("#idUsuario").val("");
        // Mostra o campo de senha para o auto-cadastro
        $("#cadastroSenha").show();
        $("h2", "#cadastroSection").text("Cadastro de Novo Usuário");
        $("#cadastroSection button[type='submit']").text("Cadastrar");
        $("#cadastroSection").show();
    });

    // Função de Login (ALTERADO para enviar usuário e senha na chamada AJAX)
// Função de Login (ALTERADO para mostrar/esconder o formulário de cadastro por cargo)
$("#loginForm").submit(function(evento) {
    evento.preventDefault();
    const usuarioInput = $("#usuario").val();
    const senhaInput = $("#senha").val();

    $.ajax({
        url: `http://localhost:3000/usuarios?nome=${usuarioInput}&senha=${senhaInput}`,
        method: 'GET',
        success: function(usuariosEncontrados) {
            if (usuariosEncontrados && usuariosEncontrados.length > 0) {
                const usuarioLogado = usuariosEncontrados[0];
                
                cargoLogado = usuarioLogado.cargo;
                idUsuarioLogado = usuarioLogado.id;
                
                $("#loginSection").hide();

                // ALTERADO: Lógica de visibilidade das seções por cargo
                if (cargoLogado === 'Administrador') {
                    // Admin vê o formulário de cadastro E a lista
                    $("#formUser")[0].reset();
                    $("#idUsuario").val("");
                    $("h2", "#cadastroSection").text("Cadastro de Usuário");
                    $("#cadastroSection button[type='submit']").text("Cadastrar");
                    // Garante que o campo de senha esteja visível e obrigatório para o Admin cadastrar
                    $("#cadastroSenha").show(); 
                    $("#cadastroSenha").prop('required', true);

                    $("#cadastroSection, #usuariosSection").show();
                } else {
                    // Outros cargos (Supervisor, Especialista) veem APENAS a lista.
                    $("#cadastroSection").hide();
                    $("#usuariosSection").show();
                }
                
                listarUsuarios();
            } else {
                mensagem("Usuário ou senha incorretos!", true);
            }
        },
        error: function() {
            mensagem("Erro ao conectar com o servidor.", true);
        }
    });
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

    // Função para LISTAR usuários (sem alteração)
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

    // Função para CADASTRAR ou EDITAR usuários (ALTERADO para incluir a senha no cadastro)
    $("#formUser").submit(function(evento) {
        evento.preventDefault();
        const nome = $("#nome").val();
        const email = $("#email").val();
        const cargo = $("#cargo").val();
        const id = $("#idUsuario").val();
        const senha = $("#cadastroSenha").val(); // Pega a senha do novo campo

        let dadoUsuario = { nome, email, cargo };
        let url = 'http://localhost:3000/usuarios';
        let method = 'POST';

        if (id) {
            // Editando um usuário (não vamos alterar a senha aqui para manter simples)
            url += `/${id}`;
            method = 'PUT';
        } else {
            // Criando um novo usuário, adicionamos a senha ao objeto
            dadoUsuario.senha = senha;
        }

        $.ajax({
            url: url,
            method: method,
            contentType: 'application/json',
            data: JSON.stringify(dadoUsuario),
            success: function() {
                if (cargoLogado) {
                    mensagemCadastro(id ? "Usuário atualizado com sucesso!" : "Usuário cadastrado com sucesso!");
                    $("#formUser")[0].reset();
                    $("#idUsuario").val("");
                    $("h2", "#cadastroSection").text("Cadastro de Usuário");
                    $("#cadastroSection button[type='submit']").text("Cadastrar");
                    listarUsuarios();
                } else {
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

    // Evento para o botão EDITAR (ALTERADO para esconder o campo de senha)
    // Evento para o botão EDITAR (ALTERADO para garantir que o formulário apareça)
$(document).on("click", ".btnEditar", function() {
    const id = $(this).data("id");
    $.ajax({
        url: `http://localhost:3000/usuarios/${id}`,
        method: 'GET',
        success: function(usuario) {
            if (cargoLogado === "Administrador" || usuario.id == idUsuarioLogado) {
                // NOVO: Garante que a seção do formulário apareça antes de preenchê-lo
                $("#cadastroSection").show();
                
                $("#nome").val(usuario.nome);
                $("#email").val(usuario.email);
                $("#cargo").val(usuario.cargo);
                $("#idUsuario").val(usuario.id);
                
                $("#cadastroSenha").hide();
                $("#cadastroSenha").prop('required', false);

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

    // Evento para o botão EXCLUIR (sem alteração)
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