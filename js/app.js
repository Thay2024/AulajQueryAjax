$(document).ready(function() {
    // Simulação de dados de usuários no frontend
    const usuarios = [
        { id: 1, nome: "Raquel", email: "raquel@gmail.com", cargo: "Administrador", senha: "admin123" },
        { id: 2, nome: "Beatriz", email: "bia@gmail.com", cargo: "Supervisor", senha: "super123" },
        { id: 3, nome: "Carmem", email: "carmem@gmail.com", cargo: "Especialista", senha: "espec123" }
    ];

    let cargoLogado = "";  // Armazenar cargo do usuário logado
    let idUsuarioLogado = null;  // Armazenar o ID do usuário logado

    // Função para exibir mensagens
    function mensagem(msg, isError = false) {
        $("#mensagemLogin").text(msg).toggleClass("error", isError);
        setTimeout(() => $("#mensagemLogin").text(""), 3000);
    }

    // Função de exibição de mensagens na parte de Cadastro
    function mensagemCadastro(msg, isError = false) {
        $("#mensagemCadastro").text(msg).toggleClass("error", isError);
        setTimeout(() => $("#mensagemCadastro").text(""), 3000);
    }

    // Função de Login
    $("#loginForm").submit(function(evento) {
        evento.preventDefault();
        const usuario = $("#usuario").val();
        const senha = $("#senha").val();

        // Simula a verificação de login com os usuários simulados
        const usuarioLogado = usuarios.find(u => u.nome === usuario && u.senha === senha);

        if (usuarioLogado) {
            cargoLogado = usuarioLogado.cargo;  // Armazenando o cargo do usuário logado
            idUsuarioLogado = usuarioLogado.id; // Armazenando o ID do usuário logado
            $("#loginSection").hide();  // Esconde a tela de login
            $("#cadastroSection").show();  // Exibe a tela de cadastro
            $("#usuariosSection").show();  // Exibe a lista de usuários
            listarUsuarios();  // Carrega a lista de usuários
        } else {
            mensagem("Usuário ou senha incorretos!", true);
        }
    });

    // Função para listar usuários
    function listarUsuarios() {
        $.ajax({
            url: "http://localhost:3000/usuarios",  // Simulação da requisição à API
            method: "GET",
            dataType: "json",
            success: function(dado) {
                let tabela = "";
                dado.forEach(usuario => {
                    let acoes = "";

                    // Controle de ações baseado no cargo do usuário logado
                    if (cargoLogado === "Administrador") {
                        // ADM pode editar e excluir qualquer usuário
                        acoes = `
                            <td><button class="btnEditar" data-id="${usuario.id}">Editar</button></td>
                            <td><button class="btnExcluir" data-id="${usuario.id}">Excluir</button></td>
                        `;
                    } else if (cargoLogado === "Supervisor" && usuario.id === idUsuarioLogado) {
                        // Supervisor só edita seus próprios dados
                        acoes = `
                            <td><button class="btnEditar" data-id="${usuario.id}">Editar</button></td>
                            <td><button class="btnExcluir" disabled>Excluir</button></td>
                        `;
                    } else if (cargoLogado === "Especialista" && usuario.id === idUsuarioLogado) {
                        // Especialista só edita seus próprios dados
                        acoes = `
                            <td><button class="btnEditar" data-id="${usuario.id}">Editar</button></td>
                            <td><button class="btnExcluir" disabled>Excluir</button></td>
                        `;
                    } else {
                        acoes = `
                            <td><button class="btnEditar" disabled>Editar</button></td>
                            <td><button class="btnExcluir" disabled>Excluir</button></td>
                        `;
                    }

                    tabela += `
                        <tr>
                            <td>${usuario.nome}</td>
                            <td>${usuario.email}</td>
                            <td>${usuario.cargo}</td>
                            ${acoes}
                        </tr>
                    `;
                });

                $("#listaUsuarios").html(tabela);
            },
            error: function() {
                mensagem("Erro ao listar usuários", true);
            }
        });
    }

    // Função para cadastrar ou editar usuários
    $("#formUser").submit(function(evento) {
        evento.preventDefault();
        const nome = $("#nome").val();
        const email = $("#email").val();
        const cargo = $("#cargo").val();
        const id = $("#idUsuario").val();

        if (!nome || !email || !cargo) {
            mensagemCadastro("Insira todos os dados corretamente", true);
            return;
        }

        const dadoUsuario = { nome, email, cargo };

        if (id) {
            // Editar usuário
            $.ajax({
                url: `http://localhost:3000/usuarios/${id}`,
                method: "PUT",
                contentType: "application/json",
                data: JSON.stringify(dadoUsuario),
                success: function() {
                    mensagemCadastro("Usuário atualizado com sucesso!");
                    $("#formUser")[0].reset();
                    $("#idUsuario").val("");
                    listarUsuarios();
                },
                error: function() {
                    mensagemCadastro("Erro ao atualizar usuário", true);
                }
            });
        } else {
            // Criar novo usuário
            $.ajax({
                url: "http://localhost:3000/usuarios",
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify(dadoUsuario),
                success: function() {
                    mensagemCadastro("Usuário cadastrado com sucesso!");
                    $("#formUser")[0].reset();
                    listarUsuarios();
                },
                error: function() {
                    mensagemCadastro("Erro ao cadastrar usuário", true);
                }
            });
        }
    });

    // Handler para o botão Sair (se usar o ID btnSair ou uma classe .btnSair)
$(document).on("click", "#btnSair, #btnSairSecundario", function() { // Ou $(document).on("click", ".btnSair", function() {
    // 1. Limpar as variáveis de estado do login
    cargoLogado = "";
    idUsuarioLogado = null;

    // 2. Esconder as seções de usuário e cadastro
    $("#cadastroSection").hide();
    $("#usuariosSection").hide();

    // 3. Limpar os campos do formulário de login
    $("#usuario").val("");
    $("#senha").val("");
    $("#mensagemLogin").text("").removeClass("error"); // Limpa qualquer mensagem anterior

    // 4. Mostrar a seção de login
    $("#loginSection").show();
});

    // Evento de editar usuário
    $(document).on("click", ".btnEditar", function() {
        const id = $(this).data("id");
        $.ajax({
            url: `http://localhost:3000/usuarios/${id}`,
            method: "GET",
            dataType: "json",
            success: function(usuario) {
                if (usuario.id === idUsuarioLogado || usuario.cargo === "Administrador") {
                    $("#nome").val(usuario.nome);
                    $("#email").val(usuario.email);
                    $("#idUsuario").val(usuario.id);
                    $("#cargo").val(usuario.cargo);
                } else {
                    mensagem("Você não tem permissão para editar esse usuário", true);
                }
            },
            error: function() {
                mensagem("Erro ao carregar dados do usuário", true);
            }
        });
    });

    // Evento de excluir usuário
    $(document).on("click", ".btnExcluir", function() {
        const id = $(this).data("id");
        $.ajax({
            url: `http://localhost:3000/usuarios/${id}`,
            method: "DELETE",
            success: function() {
                mensagem("Usuário excluído com sucesso!");
                listarUsuarios();
            },
            error: function() {
                mensagem("Erro ao excluir usuário", true);
            }
        });
    });
});
