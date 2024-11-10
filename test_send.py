import socket
import json
import time  # Importar la librería para usar sleep

# Leer los datos desde el archivo JSON
with open('test.json', 'r') as file:
    datos = json.load(file)

# Configuración del socket UDP
udp_ip = "18.207.94.236"  # IP de destino, cambia según sea necesario
udp_port = 10000          # Puerto de destino

# Crear el socket UDP
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

# Enviar cada fila de datos como payload JSON con un delay de 2 segundos
for fila in datos:
    payload = json.dumps(fila).encode('utf-8')
    sock.sendto(payload, (udp_ip, udp_port))
    print(f"Payload enviado: {payload}")
    time.sleep(2)  # Esperar 2 segundos antes de enviar el siguiente payload

# Cerrar el socket
sock.close()
