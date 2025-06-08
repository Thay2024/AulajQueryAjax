$(document).ready(function() {
    
    let cargoLogado = "";
    let idUsuarioLogado = null;

    
    function mensagem(msg, isError = false) {
        $("#mensagemLogin").text(msg).toggleClass("error", isError);
        setTimeout(() => $("#mensagemLogin").text(""), 5000);
    }
    function mensagemCadastro(msg, isError = false) {
        $("#mensagemCadastro").text(msg).toggleClass("error", isError);
        setTimeout(() => $("#mensagemCadastro").text(""), 3000);
    }

    
    $("#cadastroLink").on("click", function() {
        $("#loginSection").hide(); 
        $("#formUser")[0].reset();
        $("#idUsuario").val("");

         $("#cargo").hide();
        
        $("#cadastroSenha").show(); 
        $("h2", "#cadastroSection").text("Cadastro de Novo Usuário"); 
        $("#cadastroSection button[type='submit']").text("Cadastrar"); 
        $("#cadastroSection").show(); 
    });

    
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

                
                if (cargoLogado === 'Administrador') {
                    
                    $("#formUser")[0].reset();
                    $("#idUsuario").val("");
                    $("h2", "#cadastroSection").text("Cadastro de Usuário");
                    $("#cadastroSection button[type='submit']").text("Cadastrar");
                    
                    $("#cadastroSenha").show().prop('required', true);
                    $("#cargo").show(); 
                    $("#cadastroSection, #usuariosSection").show();
                } else {
                    
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

    
    $(document).on("click", ".btnSair", function() {
        cargoLogado = "";
        idUsuarioLogado = null;
        $("#cadastroSection, #usuariosSection").hide();
        $("#usuario").val("");
        $("#senha").val("");
        $("#mensagemLogin").text("").removeClass("error");
        $("#loginSection").show();
    });

    
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

    
$("#formUser").submit(function(evento) {
    evento.preventDefault();
    const nome = $("#nome").val();
    const email = $("#email").val();
    const id = $("#idUsuario").val();
    const senha = $("#cadastroSenha").val();

    let dadoUsuario = { nome, email };
    let url = 'http://localhost:3000/usuarios';
    let method = 'POST';

    if (id) {
        
        url += `/${id}`;
        method = 'PATCH'; 
        if (cargoLogado === 'Administrador') {
            dadoUsuario.cargo = $("#cargo").val();
        }
    } else {
        
        dadoUsuario.senha = senha;
        
        dadoUsuario.cargo = (cargoLogado === 'Administrador') ? $("#cargo").val() : "Especialista";
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
                
                if (cargoLogado === 'Administrador') {
                    $("h2", "#cadastroSection").text("Cadastro de Usuário");
                    $("#cadastroSection button[type='submit']").text("Cadastrar");
                    $("#cadastroSenha").show().prop('required', true);
                    $("#cargo").show();
                } else {
                    
                    $("#cadastroSection").hide();
                }
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

    
$(document).on("click", ".btnEditar", function() {
    const id = $(this).data("id");
    $.ajax({
        url: `http://localhost:3000/usuarios/${id}`,
        method: 'GET',
        success: function(usuario) {
            if (cargoLogado === "Administrador" || usuario.id == idUsuarioLogado) {
                $("#cadastroSection").show();
                
                $("#nome").val(usuario.nome);
                $("#email").val(usuario.email);
                $("#cargo").val(usuario.cargo);
                $("#idUsuario").val(usuario.id);
                
                $("#cadastroSenha").hide();
                $("#cadastroSenha").prop('required', false);

                if (cargoLogado === 'Administrador') {
                    $("#cargo").show(); 
                } else {
                    $("#cargo").hide(); 
                }

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