import socket
import json

# Datos del payload con el nuevo campo id_user y rpm
data = {
    "latitud": 11.0201548,
    "longitud": -74.870111,
    "fecha": "2024-10-27",
    "hora": "14:49:25.249",      # Valor de ejemplo para rpm
    "id_user": "c"     # Añadimos el campo id_user con el valor "a"
}

# Convertir el diccionario a JSON
payload = json.dumps(data).encode('utf-8')

# Configuración del socket UDP
udp_ip = "181.235.94.231"  # IP de destino, cambia según sea necesario
udp_port = 10000           # Puerto de destino

# Crear el socket UDP
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

# Enviar el payload
sock.sendto(payload, (udp_ip, udp_port))
print(f"Payload enviado: {payload}")

# Cerrar el socket
sock.close()
