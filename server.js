from scapy.all import sniff, UDP, IP
import mysql.connector
import json
import os
import time
import threading
from dotenv import load_dotenv

# Cargar las variables de entorno desde el archivo .env
load_dotenv()

print("DB_HOST:", os.getenv('DB_HOST'))
print("DB_USER:", os.getenv('DB_USER'))
print("DB_PASSWORD:", os.getenv('DB_PASSWORD'))
print("DB_NAME:", os.getenv('DB_NAME'))

# Función para obtener una nueva conexión
def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv('DB_HOST'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        database=os.getenv('DB_NAME')
    )

# Función para asegurar que la conexión está abierta
def ensure_connection_open(connection):
    if not connection.is_connected():
        print("Reconectando a la base de datos...")
        connection.reconnect()

# Conexión inicial a la base de datos
db_connection = get_db_connection()

def process_packet(packet):
    if packet.haslayer(UDP) and packet[UDP].dport == 10000:
        payload = packet[UDP].payload.load.decode('utf-8')

        try:
            data = json.loads(payload)
            latitud = data.get('latitud')
            longitud = data.get('longitud')
            fecha = data.get('fecha')
            hora = data.get('hora')
            ip_address = packet[IP].src

            # Verificar y asegurar que la conexión esté abierta
            ensure_connection_open(db_connection)
            
            cursor = db_connection.cursor()
            sql = "INSERT INTO coordenadas (Latitud, Longitud, Fecha, Hora, ip_address) VALUES (%s, %s, %s, %s, %s)"
            cursor.execute(sql, (latitud, longitud, fecha, hora, ip_address))
            db_connection.commit()
            print("Datos insertados en la base de datos")

            cursor.close()

        except json.JSONDecodeError:
            print("No se pudo decodificar el JSON")
        except mysql.connector.Error as err:
            print(f"Error de MySQL: {err}")

def keep_alive():
    while True:
        try:
            ensure_connection_open(db_connection)
            cursor = db_connection.cursor()
            cursor.execute("SELECT 1")  # Consulta ligera para mantener viva la conexión
            cursor.close()
            print("Keep-alive enviado")
        except Exception as e:
            print(f"Error en keep-alive: {e}")
        time.sleep(300)  # Cada 5 minutos

# Iniciar el thread de keep-alive
threading.Thread(target=keep_alive, daemon=True).start()

# Iniciar el sniffer
sniff(filter="udp port 10000", prn=process_packet)

# Cerrar la conexión al final (si usas alguna señal de finalización)
db_connection.close()

