from scapy.all import sniff, UDP, IP
import json

def process_packet(packet):
    if packet.haslayer(UDP) and packet[UDP].dport == 10000:
        # Obtener el mensaje puro recibido
        payload = packet[UDP].payload.load
        print("Mensaje puro recibido:", payload)

        # Decodificar el mensaje y extraer los datos
        try:
            data = json.loads(payload.decode('utf-8'))
            latitud = data.get('latitud')
            longitud = data.get('longitud')
            fecha = data.get('fecha')
            hora = data.get('hora')
            rpm = data.get('rpm', 0)  # Obtén el valor de rpm, o 0 si no está presente
            id_user = data.get('id_user', 'desconocido').lower()  # Obtén id_user en minúsculas
            ip_address = packet[IP].src 
            

            # Imprimir los datos que se "insertarían" en la base de datos
            print("Datos procesados:")
            print(f"Latitud: {latitud}")
            print(f"Longitud: {longitud}")
            print(f"Fecha: {fecha}")
            print(f"Hora: {hora}")
            print(f"RPM: {rpm}")
            print(f"ID User: {id_user}")
            print(f"IP Address: {ip_address}")

        except json.JSONDecodeError:
            print("No se pudo decodificar el JSON")

# Iniciar el sniffer en el puerto UDP 10000
sniff(filter="udp port 10000", prn=process_packet)
