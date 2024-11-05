import { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

function Usuarios() {
    const [open, setOpen] = useState(false);
    const [usuarios, setUsuarios] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        nombre: '',
        usuario: '',
        contrasena: '',
        tipoUsuario: ''
    });
    const [tiposUsuario, setTiposUsuario] = useState([]);

    useEffect(() => {
        const fetchTiposUsuario = async () => {
            const data = await window.electron.readTiposUsuario();
            setTiposUsuario(data || []);
        };
        const fetchUsuarios = async () => {
            const data = await window.electron.readUsuarios();
            setUsuarios(data || []);
        };
        fetchTiposUsuario();
        fetchUsuarios();
    }, []);

    const handleChange = (event) => {
        setFormData({ ...formData, [event.target.name]: event.target.value });
    };

    const handleSubmit = async () => {
        if (!formData.nombre || !formData.usuario || !formData.contrasena || !formData.tipoUsuario) {
            alert("Completa todos los campos.");
            return;
        }

        if (editMode) {
            // Actualizar usuario existente
            try {
                const usuariosActualizados = await window.electron.updateUsuario(formData);
                setUsuarios(usuariosActualizados);
            } catch (error) {
                alert("Error al actualizar el usuario.");
            }
        } else {
            // Añadir nuevo usuario
            const nuevoUsuario = {
                ...formData,
                id: usuarios.length + 1,
            };

            try {
                const usuariosActualizados = await window.electron.addUsuario(nuevoUsuario);
                setUsuarios(usuariosActualizados);
            } catch (error) {
                alert("Error al guardar el usuario.");
            }
        }

        handleClose();
    };

    const handleEdit = (usuario) => {
        setFormData(usuario);
        setEditMode(true);
        setOpen(true);
    };

    const handleDelete = async () => {
        try {
            const usuariosActualizados = await window.electron.deleteUsuario(formData.id);
            setUsuarios(usuariosActualizados);
            handleClose();
        } catch (error) {
            alert("Error al eliminar el usuario.");
        }
    };

    const handleClickOpen = () => {
        setFormData({ id: '', nombre: '', usuario: '', contrasena: '', tipoUsuario: '' });
        setEditMode(false);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setFormData({ id: '', nombre: '', usuario: '', contrasena: '', tipoUsuario: '' });
        setEditMode(false);
    };

    return (
        <div>
            <h1>Gestión de Usuarios</h1>
            <Button variant="outlined" onClick={handleClickOpen}>Añadir Usuario</Button>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>{editMode ? "Editar Usuario" : "Añadir Nuevo Usuario"}</DialogTitle>
                <DialogContent>
                    <TextField
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
                        id="usuario"
                        label="Usuario"
                        type="text"
                        fullWidth
                        name="usuario"
                        value={formData.usuario}
                        onChange={handleChange}
                    />
                    <TextField
                        margin="dense"
                        id="contrasena"
                        label="Contraseña"
                        type="password"
                        fullWidth
                        name="contrasena"
                        value={formData.contrasena}
                        onChange={handleChange}
                    />
                    <Select
                        labelId="tipo-usuario-label"
                        id="tipoUsuario"
                        name="tipoUsuario"
                        value={formData.tipoUsuario}
                        label="Tipo de Usuario"
                        onChange={handleChange}
                        fullWidth
                    >
                        {tiposUsuario.map((tipo) => (
                            <MenuItem key={tipo.id} value={tipo.tipo}>
                                {tipo.tipo}
                            </MenuItem>
                        ))}
                    </Select>
                </DialogContent>
                <DialogActions>
                    {editMode && (
                        <Button onClick={handleDelete} color="error">
                            Eliminar
                        </Button>
                    )}
                    <Button onClick={handleClose}>Cancelar</Button>
                    <Button onClick={handleSubmit}>{editMode ? "Actualizar" : "Guardar"}</Button>
                </DialogActions>
            </Dialog>

            <h2>Listado de Usuarios</h2>
            <table className='estandar'>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Usuario</th>
                        <th>Tipo</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {usuarios.map((usuario) => (
                        <tr key={usuario.id}>
                            <td>{usuario.id}</td>
                            <td>{usuario.nombre}</td>
                            <td>{usuario.usuario}</td>
                            <td>{usuario.tipoUsuario}</td>
                            <td>
                                <Button variant="outlined" onClick={() => handleEdit(usuario)}>
                                    Editar
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Usuarios;
