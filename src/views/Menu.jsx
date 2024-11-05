import { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

function Menu() {
    const [open, setOpen] = useState(false);
    const [platos, setPlatos] = useState([]);
    const [formData, setFormData] = useState({
        id: null,
        nombre: '',
        tipoPlato: '',
        ingredientes: [],
        precio: '', // Campo de precio agregado
    });
    const [inventario, setInventario] = useState([]);
    const [tiposPlato, setTiposPlato] = useState([]);
    const [ingredienteSeleccionado, setIngredienteSeleccionado] = useState('');
    const [cantidad, setCantidad] = useState('');
    const [editingIngredientIndex, setEditingIngredientIndex] = useState(null); 

    useEffect(() => {
        const fetchInventario = async () => {
            const data = await window.electron.readInventario();
            setInventario(data || []);
        };

        const fetchTiposPlato = async () => {
            const data = await window.electron.readTipoPlato();
            setTiposPlato(data || []);
        };

        const fetchPlatos = async () => {
            const data = await window.electron.readMenu();
            setPlatos(data || []);
        };

        fetchInventario();
        fetchTiposPlato();
        fetchPlatos();
    }, []);

    const handleChange = (event) => {
        setFormData({ ...formData, [event.target.name]: event.target.value });
    };

    const agregarIngrediente = () => {
        if (ingredienteSeleccionado && cantidad) {
            const nuevoIngrediente = {
                nombre: ingredienteSeleccionado,
                cantidad: cantidad,
            };

            if (editingIngredientIndex !== null) {
                setFormData(prev => {
                    const nuevosIngredientes = [...prev.ingredientes];
                    nuevosIngredientes[editingIngredientIndex] = nuevoIngrediente;
                    return { ...prev, ingredientes: nuevosIngredientes };
                });
                setEditingIngredientIndex(null); 
            } else {
                setFormData(prev => ({
                    ...prev,
                    ingredientes: [...prev.ingredientes, nuevoIngrediente],
                }));
            }
            
            setIngredienteSeleccionado('');
            setCantidad('');
        }
    };

    const handleEditIngredient = (index) => {
        const ingrediente = formData.ingredientes[index];
        setIngredienteSeleccionado(ingrediente.nombre);
        setCantidad(ingrediente.cantidad);
        setEditingIngredientIndex(index); 
    };

    const handleDeleteIngredient = (index) => {
        setFormData(prev => ({
            ...prev,
            ingredientes: prev.ingredientes.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async () => {
        if (!formData.nombre || !formData.tipoPlato || formData.ingredientes.length === 0 || !formData.precio) {
            alert("Por favor, completa todos los campos antes de guardar.");
            return;
        }
    
        const nuevoPlato = {
            ...formData,
            id: formData.id || platos.length + 1,
            ingredientes: formData.ingredientes,
        };
    
        console.log("Datos a enviar:", nuevoPlato); 
    
        try {
            if (formData.id) {
                const platosActualizados = await window.electron.updatePlato(nuevoPlato);
                setPlatos(platosActualizados);
            } else {
                const platosActualizados = await window.electron.addPlato(nuevoPlato);
                setPlatos(platosActualizados);
            }
            setOpen(false);
            setFormData({ id: null, nombre: '', tipoPlato: '', ingredientes: [], precio: '' });
        } catch (error) {
            alert("Ocurrió un error al guardar el plato. Inténtalo nuevamente.");
        }
    };

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setFormData({ id: null, nombre: '', tipoPlato: '', ingredientes: [], precio: '' });
        setIngredienteSeleccionado('');
        setCantidad('');
        setEditingIngredientIndex(null);
    };

    const handleEditar = (id) => {
        const plato = platos.find(p => p.id === id);
        setFormData({
            id: plato.id,
            nombre: plato.nombre,
            tipoPlato: plato.tipoPlato,
            ingredientes: plato.ingredientes || [],
            precio: plato.precio, // Asegúrate de incluir el precio
        });
        setOpen(true);
    };

    const handleEliminar = async () => {
        const confirm = window.confirm("¿Estás seguro de que quieres eliminar este plato?");
        if (confirm) {
            const platosActualizados = await window.electron.deletePlato(formData.id);
            setPlatos(platosActualizados);
            handleClose();
        }
    };

    return (
        <div>
            <h1>Pantalla de Menú</h1>
            <Button variant="outlined" onClick={handleClickOpen}>Añadir Plato</Button>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>{formData.id ? "Editar Plato" : "Añadir Nuevo Plato"}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="nombre"
                        label="Nombre"
                        type="text"
                        fullWidth
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                    />
                    <Select
                        labelId="tipo-plato-label"
                        id="tipoPlato"
                        name="tipoPlato"
                        value={formData.tipoPlato}
                        label="Tipo de Plato"
                        onChange={handleChange}
                        fullWidth
                    >
                        {tiposPlato.map((tipo) => (
                            <MenuItem key={tipo.id} value={tipo.nombre}>
                                {tipo.nombre}
                            </MenuItem>
                        ))}
                    </Select>
                    <TextField
                        margin="dense"
                        id="precio"
                        label="Precio"
                        type="number"
                        fullWidth
                        name="precio" // Asegúrate de que el nombre sea "precio"
                        value={formData.precio}
                        onChange={handleChange}
                    />
                    <h3>Ingredientes</h3>
                    <Select
                        labelId="ingrediente-label"
                        id="ingrediente"
                        value={ingredienteSeleccionado}
                        onChange={(e) => setIngredienteSeleccionado(e.target.value)}
                        fullWidth
                    >
                        {inventario.map((producto) => (
                            <MenuItem key={producto.id} value={producto.nombre}>
                                {producto.nombre}
                            </MenuItem>
                        ))}
                    </Select>
                    <TextField
                        margin="dense"
                        id="cantidad"
                        label="Cantidad"
                        type="number"
                        fullWidth
                        value={cantidad}
                        onChange={(e) => setCantidad(e.target.value)}
                    />
                    <Button onClick={agregarIngrediente}>
                        {editingIngredientIndex !== null ? "Actualizar Ingrediente" : "Añadir Ingrediente"}
                    </Button>
                    <ul>
                        {formData.ingredientes.map((ingrediente, index) => (
                            <li key={index}>
                                {`${ingrediente.nombre} - Cantidad: ${ingrediente.cantidad}`}
                                <Button onClick={() => handleEditIngredient(index)}>Editar</Button>
                                <Button onClick={() => handleDeleteIngredient(index)} color="error">Eliminar</Button>
                            </li>
                        ))}
                    </ul>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancelar</Button>
                    {formData.id && (
                        <Button onClick={handleEliminar} color="error">Eliminar</Button>
                    )}
                    <Button onClick={handleSubmit}>{formData.id ? "Actualizar" : "Guardar"}</Button>
                </DialogActions>
            </Dialog>
            <h2>Listado de Platos</h2>
            <table className='estandar'>
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Precio</th> {/* Agregado el encabezado para el precio */}
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {platos.map((plato) => (
                        <tr key={plato.id}>
                            <td>{plato.nombre}</td>
                            <td>{plato.precio}</td> {/* Agregado el precio en la tabla */}
                            <td>
                                <Button onClick={() => handleEditar(plato.id)}>Editar</Button>
                                <Button onClick={() => handleEliminar(plato.id)} color="error">Eliminar</Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Menu;
