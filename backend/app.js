const db = require('./firebase.js');
const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// Middleware para CORS (caso precise acessar de um frontend)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// ================================
// CRUD OPERAÇÕES - CLIENTES
// ================================

// CREATE - Criar Cliente
app.post('/clientes', async (req, res) => {
  try {
    const { id, nome, idade, email, telefone, cidadeId } = req.body;
    
    // Validações
    if (!id || !nome || !idade) {
      return res.status(400).json({ 
        erro: 'Campos obrigatórios: id, nome, idade' 
      });
    }

    // Verificar se cliente já existe
    const clienteExistente = await db.ref('clientes/' + id).once('value');
    if (clienteExistente.exists()) {
      return res.status(409).json({ 
        erro: 'Cliente com este ID já existe' 
      });
    }

    // Se cidadeId foi fornecido, verificar se cidade existe
    if (cidadeId) {
      const cidadeExiste = await db.ref('cidades/' + cidadeId).once('value');
      if (!cidadeExiste.exists()) {
        return res.status(400).json({ 
          erro: 'Cidade não encontrada' 
        });
      }
    }

    const cliente = {
      id,
      nome,
      idade: parseInt(idade),
      email: email || null,
      telefone: telefone || null,
      cidadeId: cidadeId || null,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    };

    await db.ref('clientes/' + id).set(cliente);
    
    res.status(201).json({ 
      mensagem: 'Cliente criado com sucesso!',
      cliente 
    });
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

// READ - Listar todos os Clientes
app.get('/clientes', async (req, res) => {
  try {
    const snapshot = await db.ref('clientes').once('value');
    const clientes = snapshot.val() || {};
    
    // Converter objeto em array para facilitar manipulação no frontend
    const clientesArray = Object.values(clientes);
    
    res.json({
      total: clientesArray.length,
      clientes: clientesArray
    });
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

// READ - Buscar Cliente por ID
app.get('/clientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const snapshot = await db.ref('clientes/' + id).once('value');
    
    if (!snapshot.exists()) {
      return res.status(404).json({ 
        erro: 'Cliente não encontrado' 
      });
    }

    const cliente = snapshot.val();
    
    // Se cliente tem cidadeId, buscar dados da cidade
    if (cliente.cidadeId) {
      const cidadeSnapshot = await db.ref('cidades/' + cliente.cidadeId).once('value');
      if (cidadeSnapshot.exists()) {
        cliente.cidade = cidadeSnapshot.val();
      }
    }

    res.json(cliente);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

// UPDATE - Atualizar Cliente
app.put('/clientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, idade, email, telefone, cidadeId } = req.body;

    // Verificar se cliente existe
    const clienteSnapshot = await db.ref('clientes/' + id).once('value');
    if (!clienteSnapshot.exists()) {
      return res.status(404).json({ 
        erro: 'Cliente não encontrado' 
      });
    }

    // Se cidadeId foi fornecido, verificar se cidade existe
    if (cidadeId) {
      const cidadeExiste = await db.ref('cidades/' + cidadeId).once('value');
      if (!cidadeExiste.exists()) {
        return res.status(400).json({ 
          erro: 'Cidade não encontrada' 
        });
      }
    }

    const clienteAtual = clienteSnapshot.val();
    const clienteAtualizado = {
      ...clienteAtual,
      nome: nome || clienteAtual.nome,
      idade: idade ? parseInt(idade) : clienteAtual.idade,
      email: email !== undefined ? email : clienteAtual.email,
      telefone: telefone !== undefined ? telefone : clienteAtual.telefone,
      cidadeId: cidadeId !== undefined ? cidadeId : clienteAtual.cidadeId,
      atualizadoEm: new Date().toISOString()
    };

    await db.ref('clientes/' + id).set(clienteAtualizado);

    res.json({ 
      mensagem: 'Cliente atualizado com sucesso!',
      cliente: clienteAtualizado 
    });
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

// DELETE - Deletar Cliente
app.delete('/clientes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se cliente existe
    const clienteSnapshot = await db.ref('clientes/' + id).once('value');
    if (!clienteSnapshot.exists()) {
      return res.status(404).json({ 
        erro: 'Cliente não encontrado' 
      });
    }

    await db.ref('clientes/' + id).remove();

    res.json({ 
      mensagem: 'Cliente deletado com sucesso!' 
    });
  } catch (error) {
    console.error('Erro ao deletar cliente:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

// ================================
// CRUD OPERAÇÕES - CIDADES
// ================================

// CREATE - Criar Cidade
app.post('/cidades', async (req, res) => {
  try {
    const { id, nome, estado, pais, populacao } = req.body;
    
    // Validações
    if (!id || !nome || !estado) {
      return res.status(400).json({ 
        erro: 'Campos obrigatórios: id, nome, estado' 
      });
    }

    // Verificar se cidade já existe
    const cidadeExistente = await db.ref('cidades/' + id).once('value');
    if (cidadeExistente.exists()) {
      return res.status(409).json({ 
        erro: 'Cidade com este ID já existe' 
      });
    }

    const cidade = {
      id,
      nome,
      estado,
      pais: pais || 'Brasil',
      populacao: populacao ? parseInt(populacao) : null,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    };

    await db.ref('cidades/' + id).set(cidade);
    
    res.status(201).json({ 
      mensagem: 'Cidade criada com sucesso!',
      cidade 
    });
  } catch (error) {
    console.error('Erro ao criar cidade:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

// READ - Listar todas as Cidades
app.get('/cidades', async (req, res) => {
  try {
    const snapshot = await db.ref('cidades').once('value');
    const cidades = snapshot.val() || {};
    
    // Converter objeto em array
    const cidadesArray = Object.values(cidades);
    
    res.json({
      total: cidadesArray.length,
      cidades: cidadesArray
    });
  } catch (error) {
    console.error('Erro ao buscar cidades:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

// READ - Buscar Cidade por ID
app.get('/cidades/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const snapshot = await db.ref('cidades/' + id).once('value');
    
    if (!snapshot.exists()) {
      return res.status(404).json({ 
        erro: 'Cidade não encontrada' 
      });
    }

    const cidade = snapshot.val();

    // Buscar clientes desta cidade
    const clientesSnapshot = await db.ref('clientes').orderByChild('cidadeId').equalTo(id).once('value');
    const clientes = clientesSnapshot.val();
    
    cidade.clientes = clientes ? Object.values(clientes) : [];
    cidade.totalClientes = cidade.clientes.length;

    res.json(cidade);
  } catch (error) {
    console.error('Erro ao buscar cidade:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

// UPDATE - Atualizar Cidade
app.put('/cidades/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, estado, pais, populacao } = req.body;

    // Verificar se cidade existe
    const cidadeSnapshot = await db.ref('cidades/' + id).once('value');
    if (!cidadeSnapshot.exists()) {
      return res.status(404).json({ 
        erro: 'Cidade não encontrada' 
      });
    }

    const cidadeAtual = cidadeSnapshot.val();
    const cidadeAtualizada = {
      ...cidadeAtual,
      nome: nome || cidadeAtual.nome,
      estado: estado || cidadeAtual.estado,
      pais: pais || cidadeAtual.pais,
      populacao: populacao ? parseInt(populacao) : cidadeAtual.populacao,
      atualizadoEm: new Date().toISOString()
    };

    await db.ref('cidades/' + id).set(cidadeAtualizada);

    res.json({ 
      mensagem: 'Cidade atualizada com sucesso!',
      cidade: cidadeAtualizada 
    });
  } catch (error) {
    console.error('Erro ao atualizar cidade:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

// DELETE - Deletar Cidade
app.delete('/cidades/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se cidade existe
    const cidadeSnapshot = await db.ref('cidades/' + id).once('value');
    if (!cidadeSnapshot.exists()) {
      return res.status(404).json({ 
        erro: 'Cidade não encontrada' 
      });
    }

    // Verificar se existem clientes vinculados a esta cidade
    const clientesSnapshot = await db.ref('clientes').orderByChild('cidadeId').equalTo(id).once('value');
    const clientes = clientesSnapshot.val();
    
    if (clientes && Object.keys(clientes).length > 0) {
      return res.status(400).json({ 
        erro: 'Não é possível deletar cidade com clientes vinculados',
        clientesVinculados: Object.keys(clientes).length
      });
    }

    await db.ref('cidades/' + id).remove();

    res.json({ 
      mensagem: 'Cidade deletada com sucesso!' 
    });
  } catch (error) {
    console.error('Erro ao deletar cidade:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

// ================================
// ROTAS RELACIONAIS
// ================================

// Buscar clientes por cidade
app.get('/cidades/:id/clientes', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se cidade existe
    const cidadeSnapshot = await db.ref('cidades/' + id).once('value');
    if (!cidadeSnapshot.exists()) {
      return res.status(404).json({ 
        erro: 'Cidade não encontrada' 
      });
    }

    const clientesSnapshot = await db.ref('clientes').orderByChild('cidadeId').equalTo(id).once('value');
    const clientes = clientesSnapshot.val() || {};
    const clientesArray = Object.values(clientes);

    res.json({
      cidade: cidadeSnapshot.val().nome,
      total: clientesArray.length,
      clientes: clientesArray
    });
  } catch (error) {
    console.error('Erro ao buscar clientes da cidade:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

// ================================
// ROTA DE SAÚDE DA API
// ================================

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    endpoints: {
      clientes: {
        'GET /clientes': 'Listar todos os clientes',
        'GET /clientes/:id': 'Buscar cliente por ID',
        'POST /clientes': 'Criar novo cliente',
        'PUT /clientes/:id': 'Atualizar cliente',
        'DELETE /clientes/:id': 'Deletar cliente'
      },
      cidades: {
        'GET /cidades': 'Listar todas as cidades',
        'GET /cidades/:id': 'Buscar cidade por ID',
        'POST /cidades': 'Criar nova cidade',
        'PUT /cidades/:id': 'Atualizar cidade',
        'DELETE /cidades/:id': 'Deletar cidade'
      },
      relacionais: {
        'GET /cidades/:id/clientes': 'Buscar clientes de uma cidade'
      }
    }
  });
});

// ================================
// INICIALIZAÇÃO DO SERVIDOR
// ================================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 API rodando na porta ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`👥 Clientes: http://localhost:${PORT}/clientes`);
  console.log(`🏙️  Cidades: http://localhost:${PORT}/cidades`);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});