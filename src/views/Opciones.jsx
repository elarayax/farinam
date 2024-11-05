import { useEffect, useState } from 'react';

const OpcionesComponent = () => {
    const [zonas, setZonas] = useState([]);
    const [nuevaZona, setNuevaZona] = useState('');
    const [mesasAAgregar, setMesasAAgregar] = useState({});
    const [nombresMesasEditando, setNombresMesasEditando] = useState({});
    const [nuevaMedida, setNuevaMedida] = useState(''); 
    const [medidas, setMedidas] = useState([]);
    const [tiposProducto, setTiposProducto] = useState([]);
    const [nuevoTipoProducto, setNuevoTipoProducto] = useState('');
    const [tipoPlato, setTipoPlato] = useState([]);
    const [nuevoTipoPlato, setNuevoTipoPlato] = useState('');
    
    // Estado para métodos de pago
    const [metodosPago, setMetodosPago] = useState([]);
    const [nuevoMetodoPago, setNuevoMetodoPago] = useState('');
    const [comisionMetodoPago, setComisionMetodoPago] = useState('');
    const [ipLocal, setIpLocal] = useState('');

    useEffect(() => {
        const fetchZonas = async () => {
            const data = await window.electron.readZonas();
            setZonas(data || []);
        };

        const fetchMedidas = async () => {
            const data = await window.electron.readMedida();
            setMedidas(data || []);
        };

        const fetchTiposProducto = async () => {
            const data = await window.electron.readTiposProducto();
            setTiposProducto(data || []);
        };

        const fetchTipoPlato = async () => {
            const data = await window.electron.readTipoPlato();
            setTipoPlato(data || []);
        };

        const fetchLocalIP = async () => {
            const localIP = await window.electron.getIpLocal(); // Llama a la función IPC para obtener la IP
            setIpLocal(localIP); // Guarda la IP local en el estado
        };

        const fetchMetodosPago = async () => {
            try {
                const metodos = await window.electron.getMetodosPago();
                console.log("Métodos de pago recibidos:", metodos); // Verifica la estructura de los datos
                setMetodosPago(metodos || []);
                console.log("Métodos de pago después de setear:", metodosPago); // Verifica el estado después de setear
            } catch (error) {
                console.error("Error al cargar métodos de pago:", error);
            }
        };
        
        fetchZonas();
        fetchMedidas();
        fetchTiposProducto();
        fetchTipoPlato();
        fetchLocalIP();
        fetchMetodosPago(); // Cargar métodos de pago
    }, []);
    
    const agregarZona = async () => {
        if (!nuevaZona) return;
        await window.electron.addZona(nuevaZona);
        setZonas(prev => [...prev, { nombre: nuevaZona, mesas: [] }]);
        setNuevaZona('');
    };
    
    const agregarMesa = async (zonaIndex) => {
        const nuevaMesaNumero = mesasAAgregar[zonaIndex];
        if (!nuevaMesaNumero || zonaIndex === null) return;
    
        const nuevaMesa = {
            numero: nuevaMesaNumero,
            estado: 'disponible',
            cantidadPersonas: 0,
            pedidoActual: 0,
        };
    
        await window.electron.addMesa(nuevaMesa, zonaIndex);
        setZonas(prevZonas => {
            const updatedZonas = [...prevZonas];
            updatedZonas[zonaIndex].mesas.push(nuevaMesa);
            return updatedZonas;
        });
        
        setMesasAAgregar(prev => ({ ...prev, [zonaIndex]: '' }));
    };

    const editarMesa = async (zonaIndex, mesaIndex) => {
        const nuevoNombre = nombresMesasEditando[`${zonaIndex}-${mesaIndex}`];
        if (!nuevoNombre) return;
    
        await window.electron.editMesa(zonaIndex, mesaIndex, nuevoNombre);
        setZonas(prevZonas => {
            const updatedZonas = [...prevZonas];
            updatedZonas[zonaIndex].mesas[mesaIndex].numero = nuevoNombre;
            return updatedZonas;
        });
    
        setNombresMesasEditando(prev => {
            const updated = { ...prev };
            delete updated[`${zonaIndex}-${mesaIndex}`];
            return updated;
        });
    };
    
    const eliminarMesa = async (zonaIndex, mesaIndex) => {
        const updatedMesas = zonas[zonaIndex].mesas.filter((_, index) => index !== mesaIndex);
        const updatedZonas = [...zonas];
        updatedZonas[zonaIndex].mesas = updatedMesas;
    
        setZonas(updatedZonas);
        await window.electron.saveZonas(updatedZonas);
    };
    
    const agregarMedida = async () => {
        if (!nuevaMedida) return;
        const medidasActualizadas = await window.electron.addMedida(nuevaMedida);
        setMedidas(medidasActualizadas);
        setNuevaMedida('');
    };
    
    const eliminarMedida = async (index) => {
        await window.electron.removeMedida(index);
        const medidasActualizadas = await window.electron.readMedida();
        setMedidas(medidasActualizadas);
    };

    const eliminarZona = async (zonaIndex) => {
        await window.electron.removeZona(zonaIndex);
        setZonas(prevZonas => prevZonas.filter((_, index) => index !== zonaIndex));
    };

    const agregarTipoProducto = async () => {
        if (!nuevoTipoProducto) return;
        const tiposActualizados = await window.electron.addTipoProducto(nuevoTipoProducto);
        setTiposProducto(tiposActualizados);
        setNuevoTipoProducto('');
    };

    const eliminarTipoProducto = async (index) => {
        await window.electron.removeTipoProducto(index);
        const tiposActualizados = await window.electron.readTiposProducto();
        setTiposProducto(tiposActualizados);
    };

    const agregarTipoPlato = async () => {
        if (!nuevoTipoPlato) return;
        const tipoPlatoActializado = await window.electron.addTipoPlato(nuevoTipoPlato);
        setTipoPlato(tipoPlatoActializado);
        setNuevoTipoPlato('');
    };

    const eliminarTipoPlato = async (index) => {
        await window.electron.removeTipoPlato(index);
        const tiposActualizados = await window.electron.readTipoPlato();
        setTipoPlato(tiposActualizados);
    };

    // Funciones CRUD para métodos de pago
    const agregarMetodoPago = async () => {
        if (!nuevoMetodoPago || !comisionMetodoPago) {
            console.error("El nombre del método de pago y la comisión son obligatorios.");
            return;
        }
    
        try {
            const metodoActualizado = await window.electron.createMetodoPago({
                nombre: nuevoMetodoPago,
                comision: comisionMetodoPago
            });
    
            // Actualiza el estado con el nuevo método de pago
            setMetodosPago(prev => {
                const updated = [...prev, metodoActualizado];
                console.log("Métodos de pago actualizados:", updated); // Verifica la actualización
                return updated;
            });
    
            setNuevoMetodoPago('');
            setComisionMetodoPago('');
        } catch (error) {
            console.error("Error al agregar método de pago:", error.message);
        }
    };

    const eliminarMetodoPago = async (id) => {
        try {
            await window.electron.deleteMetodoPago(id); // Asegúrate de que este nombre coincida
            setMetodosPago(prev => prev.filter(metodo => metodo.id !== id)); // Actualiza el estado
            console.log(`Método de pago con ID ${id} eliminado.`);
        } catch (error) {
            console.error("Error al eliminar el método de pago:", error);
        }
    };

    return (
        <div>
            <h1>Opciones</h1>
            <h2>IP Local: {ipLocal}:3001:/colaborador</h2>
            <div>
                <h2>Zonas</h2>
                <input
                    type="text"
                    value={nuevaZona}
                    onChange={(e) => setNuevaZona(e.target.value)}
                    placeholder="Agregar nueva zona"
                />
                <button onClick={agregarZona}>Agregar Zona</button>
                {
                    zonas.length > 0 ? (
                        zonas.map((zona, index) => (
                            <div key={index} className='sectionZona'>
                                <div>
                                    <h3>
                                        {zona.nombre}
                                    </h3>
                                    <button onClick={() => eliminarZona(index)}>Eliminar Zona</button>
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        value={mesasAAgregar[index] || ''} 
                                        onChange={(e) => setMesasAAgregar(prev => ({ ...prev, [index]: e.target.value }))}
                                        placeholder="Agregar nueva mesa"
                                    />
                                    <button onClick={() => agregarMesa(index)}>Agregar Mesa</button>
                                </div>
                                <table className='estandar'>
                                    <thead>
                                        <tr>
                                            <th>Mesa</th>
                                            <th></th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            zona.mesas.map((mesa, mesaIndex) => (
                                                <tr key={mesaIndex}>
                                                    <td>{mesa.numero}</td>
                                                    <td>
                                                        <button onClick={() => {
                                                            setNombresMesasEditando(prev => ({
                                                                ...prev,
                                                                [`${index}-${mesaIndex}`]: mesa.numero }));
                                                            }}>
                                                                Editar
                                                        </button>
                                                        {nombresMesasEditando[`${index}-${mesaIndex}`] && (
                                                            <div>
                                                                <input
                                                                    type="text"
                                                                    value={nombresMesasEditando[`${index}-${mesaIndex}`]} 
                                                                    onChange={(e) => setNombresMesasEditando(prev => ({
                                                                        ...prev,
                                                                        [`${index}-${mesaIndex}`]: e.target.value 
                                                                    }))}
                                                                />
                                                                <button onClick={() => editarMesa(index, mesaIndex)}>Guardar</button>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <button onClick={() => eliminarMesa(index, mesaIndex)}>Eliminar</button>
                                                    </td>
                                                </tr>
                                            ))
                                        }
                                    </tbody>
                                </table>
                            </div>
                        ))
                    ) : (
                        <p>No hay zonas disponibles</p>
                    )
                }
            </div>
            <div>
                <h2>Medidas</h2>
                <input
                    type="text"
                    value={nuevaMedida}
                    onChange={(e) => setNuevaMedida(e.target.value)}
                    placeholder="Agregar nueva medida"
                />
                <button onClick={agregarMedida}>Agregar Medida</button>
                <ul>
                    {
                        medidas.map((medida, index) => (
                            <li key={index}>
                                {medida.nombre}
                                <button onClick={() => eliminarMedida(index)}>Eliminar</button>
                            </li>
                        ))
                    }
                </ul>
            </div>
            <div>
                <h2>Tipos de Producto</h2>
                <input
                    type="text"
                    value={nuevoTipoProducto}
                    onChange={(e) => setNuevoTipoProducto(e.target.value)}
                    placeholder="Agregar nuevo tipo de producto"
                />
                <button onClick={agregarTipoProducto}>Agregar Tipo</button>
                <ul>
                    {
                        tiposProducto.map((tipo, index) => (
                            <li key={index}>
                                {tipo.nombre}
                                <button onClick={() => eliminarTipoProducto(index)}>Eliminar</button>
                            </li>
                        ))
                    }
                </ul>
            </div>
            <div>
                <h2>Tipos de Plato</h2>
                <input
                    type="text"
                    value={nuevoTipoPlato}
                    onChange={(e) => setNuevoTipoPlato(e.target.value)}
                    placeholder="Agregar nuevo tipo de plato"
                />
                <button onClick={agregarTipoPlato}>Agregar Tipo</button>
                <ul>
                    {
                        tipoPlato.map((tipo, index) => (
                            <li key={index}>
                                {tipo.nombre}
                                <button onClick={() => eliminarTipoPlato(index)}>Eliminar</button>
                            </li>
                        ))
                    }
                </ul>
            </div>
            <div>
                <h2>Métodos de Pago</h2>
                <input
                    type="text"
                    value={nuevoMetodoPago}
                    onChange={(e) => setNuevoMetodoPago(e.target.value)}
                    placeholder="Nombre del método de pago"
                />
                <input
                    type="text"
                    value={comisionMetodoPago}
                    onChange={(e) => setComisionMetodoPago(e.target.value)}
                    placeholder="Comisión (%)"
                />
                <button onClick={agregarMetodoPago}>Agregar Método de Pago</button>
                <ul>
                    {
                        metodosPago.map((metodo, index) => {
                            if (!metodo || !metodo.nombre || !metodo.comision) {
                                console.error("Método de pago inválido en el índice:", index, metodo);
                                return null; // O maneja el caso de manera adecuada
                            }
                            return (
                                <li key={index}>
                                    {metodo.nombre} - Comisión: {metodo.comision}%
                                    <button onClick={() => eliminarMetodoPago(metodo.id)}>Eliminar</button>
                                </li>
                            );
                        })
                    }
                </ul>
            </div>
        </div>
    );
};

export default OpcionesComponent;
