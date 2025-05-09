import { useEffect, useState } from "react";
import axios from 'axios';
import Header from "../components/header";

function Estoque() {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    stock: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Create an axios instance with auth header
  const api = axios.create({
    baseURL: 'http://localhost:3333',
    withCredentials: true
  });
  
  // Add request interceptor to include token in all requests
  api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  
  // Função para buscar produtos
  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      console.log("Resposta da API:", res.data);
      const data = Array.isArray(res.data) ? res.data : [];
      setProducts(data);
      setError('');
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
      if (err.response && err.response.status === 401) {
        setError('Você precisa estar logado para visualizar produtos.');
      } else {
        setError('Erro ao carregar produtos. Por favor, tente novamente.');
      }
    }
  };
  
  useEffect(() => {
    fetchProducts();
  }, []);
  
  // Função para adicionar um novo produto
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      // Make sure data types are correct before sending
      const productData = {
        name: newProduct.name,
        description: newProduct.description,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock)
      };
      
      console.log("Sending product data:", productData);
      
      const res = await api.post('/products', productData);
      setProducts([...products, res.data]);
      setNewProduct({ name: '', description: '', price: '', stock: '' });
      setSuccessMessage('Produto adicionado com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000); // Remove message after 3 seconds
      setError('');
    } catch (err) {
      console.error('Erro ao adicionar produto:', err);
      
      let errorMessage = 'Erro ao adicionar produto.';
      if (err.response) {
        console.log("Error response data:", err.response.data);
        
        if (err.response.status === 401) {
          errorMessage = 'Você precisa estar logado para adicionar produtos.';
        } else if (err.response.status === 500) {
          errorMessage = `Erro interno no servidor: ${err.response.data.message || 'Tente novamente mais tarde.'}`;
        } else if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data && err.response.data.errors) {
          const validationErrors = err.response.data.errors;
          errorMessage = 'Erros de validação: ' + 
            Object.values(validationErrors).flat().join(', ');
        }
      }
      
      setError(errorMessage);
    }
  };
  
  // Função para deletar um produto
  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await api.delete(`/products/${productId}`);
        setProducts(products.filter(product => product.id !== productId));
        setSuccessMessage('Produto excluído com sucesso!');
        setTimeout(() => setSuccessMessage(''), 3000); // Remove message after 3 seconds
      } catch (err) {
        console.error('Erro ao excluir produto:', err);
        
        let errorMessage = 'Erro ao excluir produto.';
        if (err.response) {
          if (err.response.status === 401) {
            errorMessage = 'Você precisa estar logado para excluir produtos.';
          } else if (err.response.data && err.response.data.message) {
            errorMessage = err.response.data.message;
          }
        }
        
        setError(errorMessage);
      }
    }
  };
  
  // Função de pesquisa
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold text-blue-700 mb-4">Estoque de Produtos</h1>
        
        {/* Exibição de erros */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {/* Exibição de mensagens de sucesso */}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {successMessage}
          </div>
        )}

        {/* Painel de Pesquisa */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Pesquisar produto"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-2 border rounded w-full"
          />
        </div>

        {/* Formulário para Adicionar Novo Produto */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Adicionar Novo Produto</h2>
          <form onSubmit={handleAddProduct}>
            <div className="grid grid-cols-1 gap-4 mb-4">
              <input
                type="text"
                placeholder="Nome do Produto"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                className="p-2 border rounded"
                required
              />
              <input
                type="text"
                placeholder="Descrição"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                className="p-2 border rounded"
              />
              <input
                type="number"
                placeholder="Preço"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                className="p-2 border rounded"
                required
              />
              <input
                type="number"
                placeholder="Estoque"
                value={newProduct.stock}
                onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                className="p-2 border rounded"
                required
              />
            </div>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
              Adicionar Produto
            </button>
          </form>
        </div>

        {/* Exibindo os Produtos */}
        <div className="grid grid-cols-1 gap-4">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white p-4 rounded-lg shadow hover:shadow-md transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{product.name}</h2>
                    <p className="text-gray-600 mb-2">{product.description}</p>
                    <p className="text-gray-800">
                      Preço:{" "}
                      <span className="text-green-600 font-medium">
                        R$ {Number(product.price).toFixed(2)}
                      </span>
                    </p>
                    <p className="text-gray-800">Estoque: {product.stock} unidades</p>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleDeleteProduct(product.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 mt-10">
              Nenhum produto encontrado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Estoque;