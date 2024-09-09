from scapy.all import sniff, UDP, IP
import mysql.connector
import json
import os
from dotenv import load_dotenv

# Cargar las variables de entorno desde el archivo .env
load_dotenv()
# Imprimir valores de las variables de entorno para verificación
print("DB_HOST:", os.getenv('DB_HOST'))
print("DB_USER:", os.getenv('DB_USER'))
print("DB_PASSWORD:", os.getenv('DB_PASSWORD'))
print("DB_NAME:", os.getenv('DB_NAME'))
# Conexión a la base de datos MySQL usando variables de entorno
db_connection = mysql.connector.connect(
<<<<<<< HEAD
    host= 'database-server.cne06wq0y35e.us-east-1.rds.amazonaws.com',
    user= 'maicoll',
    password= 'mysql1004362482',
    database= 'alm_rastreo'
=======
    host=os.getenv('DB_HOST'),
    user=os.getenv('DB_USER'),
    password=os.getenv('DB_PASSWORD'),
    database=os.getenv('DB_NAME')
>>>>>>> 071249bd34d7ebad9070b37e17685039a8f8559f
)
cursor = db_connection.cursor()

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

            sql = "INSERT INTO coordenadas (Latitud, Longitud, Fecha, Hora, ip_address) VALUES (%s, %s, %s, %s, %s)"
            cursor.execute(sql, (latitud, longitud, fecha, hora, ip_address))
            db_connection.commit()
            print("Datos insertados en la base de datos")

        except json.JSONDecodeError:
            print("No se pudo decodificar el JSON")

# Captura los paquetes UDP en el puerto 10000
sniff(filter="udp port 10000", prn=process_packet)
