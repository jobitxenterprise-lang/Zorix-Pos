import Swal from 'sweetalert2';

// Configuración predeterminada de colores y diseño para Zorix POS (Paleta Azul / Neutra)
const customSwal = Swal.mixin({
  customClass: {
    popup: 'rounded-2xl shadow-2xl border border-slate-200 font-sans',
    title: 'text-blue-950 font-bold text-xl',
    htmlContainer: 'text-slate-600 text-sm font-medium',
    confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md cursor-pointer transition-colors mx-1 text-sm',
    cancelButton: 'bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-5 py-2.5 rounded-xl cursor-pointer transition-colors mx-1 text-sm',
    input: 'rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-600'
  },
  buttonsStyling: false
});

/**
 * Muestra una alerta informativa, de advertencia o de error.
 */
export const showAlert = ({ title, text, icon = 'info', timer }) => {
  return customSwal.fire({
    title,
    text,
    icon,
    timer,
    timerProgressBar: Boolean(timer)
  });
};

/**
 * Muestra una alerta de éxito.
 */
export const showSuccess = (title, text = '') => {
  return customSwal.fire({
    title,
    text,
    icon: 'success',
    timer: 2000,
    timerProgressBar: true,
    showConfirmButton: false
  });
};

/**
 * Muestra una alerta de error.
 */
export const showError = (title, text = '') => {
  return customSwal.fire({
    title,
    text,
    icon: 'error'
  });
};

/**
 * Muestra una alerta de confirmación (remplaza confirm()).
 * @returns {Promise<boolean>} Resolves to true if confirmed, false otherwise.
 */
export const showConfirm = async ({
  title,
  text = '',
  confirmButtonText = 'Sí, confirmar',
  cancelButtonText = 'Cancelar',
  icon = 'warning'
}) => {
  const result = await customSwal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true
  });
  return result.isConfirmed;
};

/**
 * Muestra una ventana de entrada de texto (remplaza prompt()).
 * @returns {Promise<string|null>} Resolves to input string or null if canceled.
 */
export const showInputPrompt = async ({
  title,
  text = '',
  inputPlaceholder = '',
  inputValue = '',
  required = false
}) => {
  const result = await customSwal.fire({
    title,
    text,
    input: 'text',
    inputValue,
    inputPlaceholder,
    showCancelButton: true,
    confirmButtonText: 'Aceptar',
    cancelButtonText: 'Cancelar',
    inputValidator: (value) => {
      if (required && !value?.trim()) {
        return 'Este campo es obligatorio';
      }
      return null;
    }
  });

  if (result.isConfirmed) {
    return result.value;
  }
  return null;
};
