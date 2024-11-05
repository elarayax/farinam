import { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

function Inventario() {
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false); // Para saber si estamos en modo edición
    const [medidas, setMedidas] = useState([]);
    const [tiposProducto, setTiposProducto] = useState([]);
    const [inventario, setInventario] = useState([]);
    const [formData, setFormData] = useState({
        id: '', // Agregamos un campo ID para identificar el producto
        nombre: '',
        cantidad: '',
        medida: '',
        tipoProducto: '',
    });

    useEffect(() => {
        const fetchMedidas = async () => {
            const data = await window.electron.readMedida();
            setMedidas(data || []);
        };
    
        const fetchTiposProducto = async () => {
            const data = await window.electron.readTiposProducto();
            setTiposProducto(data || []);
        };
    
        fetchMedidas();
        fetchTiposProducto();
        fetchProductos();
    }, []);

    const fetchProductos = async () => {
        const data = await window.electron.readInventario();
        setInventario(data || []);
    };

    const handleChange = (event) => {
        setFormData({ ...formData, [event.target.name]: event.target.value });
    };

    const handleSubmit = async () => {
        try {
            if (editMode) {
                // Editar producto existente
                const inventarioActualizado = await window.electron.editInventario(formData);
                console.log('Producto editado:', inventarioActualizado);
            } else {
                // Agregar nuevo producto
                const nuevoProducto = {
                    nombre: formData.nombre,
                    cantidad: formData.cantidad,
                    medida: formData.medida,
                    tipoProducto: formData.tipoProducto,
                };

                const inventarioActualizado = await window.electron.addInventario(nuevoProducto);
                console.log('Inventario actualizado:', inventarioActualizado);
            }
            fetchProductos();
            setOpen(false); // Cerrar el diálogo después de guardar
            setFormData({ id: '', nombre: '', cantidad: '', medida: '', tipoProducto: '' }); // Limpiar formulario
            setEditMode(false); // Resetear el modo de edición
        } catch (error) {
            console.error("Error al agregar o editar el producto:", error);
        }
    };

    const handleClickOpen = (producto = null) => {
        if (producto) {
            setFormData(producto); // Cargar el producto en el formulario
            setEditMode(true); // Cambiar a modo edición
        } else {
            setFormData({ id: '', nombre: '', cantidad: '', medida: '', tipoProducto: '' });
            setEditMode(false); // Si no hay producto, estamos en modo agregar
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEditMode(false); // Reseteamos el modo de edición
    };

    const agruparProductosPorTipo = () => {
        return inventario.reduce((acc, producto) => {
            const tipo = producto.tipoProducto;
            if (!acc[tipo]) acc[tipo] = [];
            acc[tipo].push(producto);
            return acc;
        }, {});
    };

    const productosAgrupados = agruparProductosPorTipo();

    const handleDelete = async (id) => {
        try {
            const inventarioActualizado = await window.electron.deleteInventario(id);
            setInventario(inventarioActualizado); // Actualiza el estado del inventario
            console.log('Producto eliminado:', id);
            setOpen(false);
        } catch (error) {
            console.error("Error al eliminar el producto:", error);
        }
    };

    return (
        <div>
            <h1>Inventario</h1>
            <div className='contenido'>
                <div className='principal'>
                    <h2>Listado Inventario</h2>
                    <div>
                        {Object.keys(productosAgrupados).map((tipo) => (
                            <div key={tipo}>
                                <h3>{tipo}</h3>
                                <table className='estandar'>
                                    <thead>
                                        <tr>
                                            <th>Nombre Producto</th>
                                            <th>Cantidad</th>
                                            <th>Medida</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {productosAgrupados[tipo].map((producto) => (
                                            <tr key={producto.id}>
                                                <td>{producto.nombre}</td>
                                                <td>{producto.cantidad}</td>
                                                <td>{producto.medida}</td>
                                                <td>
                                                    <Button
                                                        variant="outlined"
                                                        onClick={() => handleClickOpen(producto)} // Abre el diálogo con el producto
                                                    >
                                                        Editar
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                </div>
                <div className='ayuda'>
                    <h2>Acciones</h2>
                    <Button className='primary full-size' variant="outlined" onClick={() => handleClickOpen()}>
                        Agregar Producto
                    </Button>
                    <Dialog open={open} onClose={handleClose}>
                        <DialogTitle>{editMode ? 'Editar Producto' : 'Agregar Nuevo Producto'}</DialogTitle>
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
                            <TextField
                                margin="dense"
                                id="cantidad"
                                label="Cantidad"
                                type="text"
                                fullWidth
                                name="cantidad"
                                value={formData.cantidad}
                                onChange={handleChange}
                            />
                            <Select
                                labelId="medida-label"
                                id="medida"
                                name="medida"
                                value={formData.medida || ''}
                                label="Medida"
                                onChange={handleChange}
                                fullWidth
                            >
                                {medidas.map((medida) => (
                                    <MenuItem key={medida.id} value={medida.nombre}>
                                        {medida.nombre}
                                    </MenuItem>
                                ))}
                            </Select>
                            <Select
                                labelId="tipo-producto-label"
                                id="tipoProducto"
                                name="tipoProducto"
                                value={formData.tipoProducto || ''}
                                label="Tipo de Producto"
                                onChange={handleChange}
                                fullWidth
                            >
                                {tiposProducto.map((tipoProducto) => (
                                    <MenuItem key={tipoProducto.id} value={tipoProducto.nombre}>
                                        {tipoProducto.nombre}
                                    </MenuItem>
                                ))}
                            </Select>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleClose}>Cancelar</Button>
                            <Button onClick={handleSubmit}>{editMode ? 'Guardar Cambios' : 'Guardar'}</Button>
                            {editMode && (
                                <Button 
                                    onClick={() => handleDelete(formData.id)} 
                                    color="error"
                                >
                                    Borrar
                                </Button>
                            )}
                        </DialogActions>
                    </Dialog>
                </div>
            </div>
        </div>
    );
}

export default Inventario;
