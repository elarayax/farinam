import { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import TextField from '@mui/material/TextField';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

function Pedidos() {
    const [open, setOpen] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [zonas, setZonas] = useState([]);
    const [mozos, setMozos] = useState([]);
    const [platos, setPlatos] = useState([]);
    const [pedidos, setPedidos] = useState([]);
    const [selectedPlatos, setSelectedPlatos] = useState([]);
    const [selectedMozo, setSelectedMozo] = useState('');
    const [selectedZona, setSelectedZona] = useState('');
    const [selectedMesa, setSelectedMesa] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPlato, setSelectedPlato] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [currentPedido, setCurrentPedido] = useState(null);
    const [metodosPago, setMetodosPago] = useState([]);
    const [selectedMetodoPago, setSelectedMetodoPago] = useState('');
    const [metodoPagoCantidad, setMetodoPagoCantidad] = useState(0); // Almacena la cantidad del método de pago
    const [precioTotal, setPrecioTotal] = useState(0);
    const [propina, setPropina] = useState(0);
    const [pedidosFinalizados, setPedidosFinalizados] = useState([]);

    useEffect(() => {
        const fetchZonas = async () => setZonas(await window.electron.readZonas() || []);
        const fetchMozos = async () => setMozos(await window.electron.readUsuarios() || []);
        const fetchPlatos = async () => setPlatos(await window.electron.readMenu() || []);
        const fetchPedidos = async () => setPedidos(await window.electron.readPedidosEnProceso() || []);
        const fetchMetodosPago = async () => setMetodosPago(await window.electron.getMetodosPago() || []);
        const fetchPedidosFinalizados = async () => setPedidosFinalizados(await window.electron.readPedidosFinalizados() || []);
    
        fetchZonas();
        fetchMozos();
        fetchPlatos();
        fetchPedidos();
        fetchMetodosPago();
        fetchPedidosFinalizados();
    }, []);

    useEffect(() => {
        // Calcular precio total y propina
        const calcularPrecioTotal = () => {
            const total = selectedPlatos.reduce((total, plato) => total + (plato.precio * plato.cantidad), 0);
            setPrecioTotal(total);
            setPropina(total * 0.10); // Calcular propina como 10% del total
        };

        calcularPrecioTotal();
    }, [selectedPlatos]);

    const calculateTotalPrice = (platos) => {
        return platos.reduce((total, plato) => total + (plato.precio * plato.cantidad), 0);
    };

    const handleSubmit = async () => {
        if (!selectedZona || !selectedMesa || selectedPlatos.length === 0 || !selectedMozo) {
            setSnackbarMessage("Completa todos los campos antes de guardar.");
            setSnackbarOpen(true);
            return;
        }
    
        const mesaSeleccionada = zonas.find(zona => zona.nombre === selectedZona)
            ?.mesas.find(mesa => mesa.numero === selectedMesa);
    
        if (mesaSeleccionada) {
            if (mesaSeleccionada.estado === "ocupada" && !isEditing) {
                setSnackbarMessage("La mesa ya está ocupada.");
                setSnackbarOpen(true);
                return;
            }
        }
    
        // Calcular el precio total
        const precioTotal = selectedPlatos.reduce((total, plato) => total + (plato.precio * plato.cantidad), 0);
    
        const pedidoData = {
            idMesa: selectedMesa,
            platos: selectedPlatos,
            idMozo: selectedMozo,
            estadoPedido: 'pendiente',
            precioTotal: precioTotal // Agregar el precio total al objeto pedidoData
        };
    
        try {
            if (isEditing && currentPedido) {
                await window.electron.updatePedido(currentPedido.id, pedidoData);
                setPedidos(pedidos.map(p => (p.id === currentPedido.id ? { ...p, ...pedidoData } : p)));
                setSnackbarMessage("Pedido actualizado exitosamente.");
            } else {
                const newPedido = await window.electron.addPedido(pedidoData);
                await window.electron.updateMesa(selectedZona, selectedMesa, { estado: "ocupada", pedidoActual: newPedido.id });
                setPedidos([...pedidos, { ...pedidoData, id: newPedido.id }]);
                setSnackbarMessage("Pedido añadido exitosamente.");
            }
    
            await updateStock(selectedPlatos);
            setSnackbarOpen(true);
            handleClose();
        } catch (error) {
            console.error("Error al guardar el pedido:", error);
            setSnackbarMessage("Error al guardar el pedido. Inténtalo de nuevo.");
            setSnackbarOpen(true);
        }
    };
    

    const handleClose = () => {
        setOpen(false);
        setSelectedPlatos([]);
        setSelectedMozo('');
        setSelectedMesa('');
        setSelectedZona('');
        setSearchTerm('');
        setSelectedMetodoPago('');
        setIsEditing(false);
        setCurrentPedido(null);
        setPropina(0);
        setMetodoPagoCantidad(0); // Resetea la cantidad del método de pago
    };

    const handleSnackbarClose = () => setSnackbarOpen(false);

    const handleSelectPlato = (event) => setSelectedPlato(event.target.value);

    const handleAddPlatoToPedido = () => {
        const platoSeleccionado = platos.find(plato => plato.id === selectedPlato);
        if (platoSeleccionado && !selectedPlatos.some(p => p.id === selectedPlato)) {
            setSelectedPlatos([...selectedPlatos, { ...platoSeleccionado, cantidad: 1, observaciones: '' }]);
        }
    };

    const handleRemovePlato = (platoId) => setSelectedPlatos(selectedPlatos.filter(p => p.id !== platoId));

    const handleQuantityChange = (id, cantidad) => {
        if (cantidad < 1) return;
        setSelectedPlatos(selectedPlatos.map(p => p.id === id ? { ...p, cantidad } : p));
    };

    const handleObservacionesChange = (id, observaciones) => {
        setSelectedPlatos(selectedPlatos.map(p => p.id === id ? { ...p, observaciones } : p));
    };

    const filteredPlatos = platos.filter(plato => plato.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

    const updateStock = async (platos) => {
        if (!Array.isArray(platos)) return;

        try {
            for (const plato of platos) {
                const ingredientes = await window.electron.getIngredientesByPlato(plato.id);
                if (!Array.isArray(ingredientes)) continue;

                for (const ingrediente of ingredientes) {
                    let multiplicar = ingrediente.cantidad * plato.cantidad;
                    await window.electron.reduceStock(ingrediente.id, multiplicar);
                }
            }
        } catch (error) {
            console.error("Error al actualizar el stock:", error);
            setSnackbarMessage("Error al actualizar el stock.");
            setSnackbarOpen(true);
        }
    };

    const handleEditPedido = (pedido) => {
        setCurrentPedido(pedido);
        setSelectedZona(zonas.find(zona => zona.mesas.some(mesa => mesa.numero === pedido.idMesa))?.nombre);
        setSelectedMesa(pedido.idMesa);
        setSelectedMozo(pedido.idMozo);
        setSelectedPlatos(pedido.platos);
        setIsEditing(true);
        setOpen(true);
    };

    const handleFinalizePedido = async (pedido) => {
        try {
            const total = calculateTotalPrice(pedido.platos);
            const totalConPropina = total + propina; // Asegúrate de que propina es la más reciente
    
            await window.electron.finalizarPedido(pedido.id, totalConPropina, [{ metodoPago: selectedMetodoPago, cantidad: metodoPagoCantidad }]);
    
            await window.electron.updateMesa(selectedZona, pedido.idMesa, { estado: "disponible", pedidoActual: null });
    
            setPedidos(pedidos.filter(p => p.id !== pedido.id));
    
            setSnackbarMessage("Pedido finalizado exitosamente.");
            setSnackbarOpen(true);
        } catch (error) {
            console.error("Error al finalizar el pedido:", error);
            setSnackbarMessage("Error al finalizar el pedido. Inténtalo de nuevo.");
            setSnackbarOpen(true);
        }
    };

    return (
        <div>
            <Button variant="outlined" onClick={() => setOpen(true)}>Añadir Pedido</Button>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>{isEditing ? 'Editar Pedido' : 'Añadir Pedido'}</DialogTitle>
                <DialogContent>
                    <Select value={selectedZona} onChange={(e) => setSelectedZona(e.target.value)}>
                        {zonas.map(zona => (
                            <MenuItem key={zona.nombre} value={zona.nombre}>{zona.nombre}</MenuItem>
                        ))}
                    </Select>
                    <Select value={selectedMesa} onChange={(e) => setSelectedMesa(e.target.value)}>
                        {zonas.find(zona => zona.nombre === selectedZona)?.mesas.map(mesa => (
                            <MenuItem key={mesa.numero} value={mesa.numero}>{mesa.numero}</MenuItem>
                        ))}
                    </Select><br />
                    <Select value={selectedMozo} onChange={(e) => setSelectedMozo(e.target.value)}>
                        {mozos.map(mozo => (
                            <MenuItem key={mozo.id} value={mozo.id}>{mozo.nombre}</MenuItem>
                        ))}
                    </Select><br />
                    <TextField label="Buscar Platos" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    <Select value={selectedPlato} onChange={handleSelectPlato}>
                        {filteredPlatos.map(plato => (
                            <MenuItem key={plato.id} value={plato.id}>{plato.nombre}</MenuItem>
                        ))}
                    </Select>
                    <Button onClick={handleAddPlatoToPedido}>Añadir Plato</Button>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Plato</TableCell>
                                    <TableCell>Cantidad</TableCell>
                                    <TableCell>Observaciones</TableCell>
                                    <TableCell>Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {selectedPlatos.map(plato => (
                                    <TableRow key={plato.id}>
                                        <TableCell>{plato.nombre}</TableCell>
                                        <TableCell>
                                            <TextField
                                                type="number"
                                                value={plato.cantidad}
                                                onChange={(e) => handleQuantityChange(plato.id, parseInt(e.target.value))}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                value={plato.observaciones}
                                                onChange={(e) => handleObservacionesChange(plato.id, e.target.value)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Button onClick={() => handleRemovePlato(plato.id)}>Eliminar</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    {isEditing && (
                        <div>
                            <TextField
                                type="number"
                                label="Propina"
                                value={propina}
                                onChange={(e) => setPropina(parseFloat(e.target.value))}
                            />
                            <Select value={selectedMetodoPago} onChange={(e) => setSelectedMetodoPago(e.target.value)}>
                                {metodosPago.map(metodo => (
                                    <MenuItem key={metodo.id} value={metodo.id}>{metodo.nombre}</MenuItem>
                                ))}
                            </Select>
                            <TextField
                                type="number"
                                label="Cantidad Método de Pago"
                                value={metodoPagoCantidad}
                                onChange={(e) => setMetodoPagoCantidad(parseFloat(e.target.value))}
                            />
                            <h3>Total Venta: {precioTotal.toFixed(2)} </h3> 
                            <h3>Total Venta con Propina: {(precioTotal + (propina || 0)).toFixed(2)} </h3>
                        </div>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleSubmit}>{isEditing ? 'Actualizar' : 'Añadir'}</Button>
                    <Button onClick={handleClose}>Cancelar</Button>
                </DialogActions>
            </Dialog>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID Mesa</TableCell>
                            <TableCell>Platos</TableCell>
                            <TableCell>Valor Total</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {pedidos.map(pedido => (
                            <TableRow key={pedido.id}>
                                <TableCell>{pedido.idMesa}</TableCell>
                                <TableCell>{pedido.platos.map(p => p.nombre).join(', ')}</TableCell>
                                <TableCell>{pedido.precioTotal}</TableCell>
                                <TableCell>{pedido.estadoPedido}</TableCell>
                                <TableCell>
                                    <Button onClick={() => handleEditPedido(pedido)}>Editar</Button>
                                    <Button onClick={() => handleFinalizePedido(pedido)}>Finalizar</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>ID Mesa</TableCell>
                            <TableCell>Platos</TableCell>
                            <TableCell>ID Mozo</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {pedidosFinalizados.map((pedido) => (
                            <TableRow key={pedido.id}>
                                <TableCell>{pedido.id}</TableCell>
                                <TableCell>{pedido.idMesa}</TableCell>
                                <TableCell>{pedido.platos.map(plato => plato.nombre).join(', ')}</TableCell>
                                <TableCell>{pedido.idMozo}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose} message={snackbarMessage} />
        </div>
    );
}

export default Pedidos;
