from scapy.all import sniff, UDP, IP
import mysql.connector
import json

# Conexión a la base de datos MySQL
db_connection = mysql.connector.connect(
    host="localhost",
    user="root",
    password="mysql1004362482",
    database="alm_rastreo"
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
