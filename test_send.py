import socket
import json
import time
from datetime import datetime
import pytz

# Configurar la zona horaria de Colombia
colombia_tz = pytz.timezone('America/Bogota')

# Leer los datos desde el archivo JSON
with open('test.json', 'r') as file:
    datos = json.load(file)

# Configuración del socket UDP
udp_ip = "18.207.94.236"  # IP de destino, cambia según sea necesario
udp_port = 10000          # Puerto de destino

# Crear el socket UDP
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

# Enviar los datos de forma cíclica
while True:
    for fila in datos:
        # Obtener la fecha y hora actuales en la zona horaria de Colombia
        now_colombia = datetime.now(colombia_tz)
        fila["fecha"] = now_colombia.strftime("%Y-%m-%d")
        fila["hora"] = now_colombia.strftime("%H:%M:%S")
        payload = json.dumps(fila).encode('utf-8')
        sock.sendto(payload, (udp_ip, udp_port))
        print(f"Payload: {payload}")
        time.sleep(2)  # Esperar 2 segundos antes de enviar el siguiente payload

# Cerrar el socket (no se alcanzará debido al bucle infinito)
sock.close()
