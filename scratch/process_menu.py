import zipfile
import xml.etree.ElementTree as ET
import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

z = zipfile.ZipFile(r'C:\Users\MSI\Downloads\menu_parque_acuatico_telica.xlsx')

shared_strings = []
if 'xl/sharedStrings.xml' in z.namelist():
    tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
    for si in tree.findall('.//{*}si'):
        t_elems = si.findall('.//{*}t')
        text = "".join([t.text for t in t_elems if t.text])
        shared_strings.append(text)

sheet_bytes = z.read('xl/worksheets/sheet1.xml')
sheet_xml = ET.fromstring(sheet_bytes)
rows = sheet_xml.findall('.//{*}row')

raw_items = []

for row in rows[1:]: # Skip header
    cells = row.findall('.//{*}c')
    row_dict = {}
    for cell in cells:
        cell_ref = cell.attrib.get('r')
        col_letter = re.sub(r'\d+', '', cell_ref)
        cell_type = cell.attrib.get('t')
        val_elem = cell.find('{*}v')
        val = val_elem.text if val_elem is not None else ""
        
        if cell_type == 's' and val.isdigit():
            val = shared_strings[int(val)]
        elif cell_type == 'inlineStr':
            is_elem = cell.find('{*}is')
            if is_elem is not None:
                t_elems = is_elem.findall('.//{*}t')
                val = "".join([t.text for t in t_elems if t.text])
        elif val_elem is None:
            t_elem = cell.find('{*}t')
            if t_elem is not None and t_elem.text:
                val = t_elem.text

        row_dict[col_letter] = val.strip()

    cat = row_dict.get('A', '')
    prod_name = row_dict.get('B', '')
    price_str = row_dict.get('C', '0')
    notes = row_dict.get('D', '')

    if not cat or not prod_name:
        continue

    try:
        price = float(price_str)
    except ValueError:
        price = 0.0

    raw_items.append({
        'raw_category': cat,
        'name': prod_name,
        'price': price,
        'notes': notes
    })

print(f"Total raw items parsed: {len(raw_items)}")

def get_category_info(cat):
    cat_lower = cat.lower()
    slug_map = {
        'batidos': ('batidos', 'Batidos', 'Drink', 'bebida'),
        'bebidas': ('bebidas', 'Bebidas', 'GlassWater', 'bebida'),
        'cerdo': ('cerdo', 'Cerdo', 'Utensils', 'comida'),
        'cervezas': ('cervezas', 'Cervezas', 'Beer', 'bebida'),
        'cocteles': ('cocteles', 'Cocteles', 'Wine', 'bebida'), # O si es ceviche/cocteles de camarón, comanda cocina/barra
        'comidas rápidas': ('comidas_rapidas', 'Comidas Rápidas', 'UtensilsCrossed', 'comida'),
        'consomes': ('consomes', 'Consomés', 'Soup', 'comida'),
        'entradas': ('entradas', 'Entradas', 'Utensils', 'comida'),
        'extras': ('extras', 'Extras', 'Plus', 'comida'),
        'licores': ('licores', 'Licores', 'GlassWater', 'bebida'),
        'mariscos': ('mariscos', 'Mariscos', 'Fish', 'comida'),
        'pollo': ('pollo', 'Pollo', 'Drumstick', 'comida'),
        'res': ('res', 'Res', 'Beef', 'comida'),
        'sopas': ('sopas', 'Sopas', 'Soup', 'comida'),
        'variados': ('variados', 'Variados', 'Utensils', 'comida')
    }

    norm_key = cat_lower.replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u')
    for k, v in slug_map.items():
        if k.replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u') == norm_key:
            return v
            
    return (norm_key.replace(' ', '_'), cat, 'Utensils', 'comida')

processed_categories = {}
processed_products = []

for item in raw_items:
    cat_id, cat_name, icon, print_type = get_category_info(item['raw_category'])
    if cat_id not in processed_categories:
        processed_categories[cat_id] = {
            'id': cat_id,
            'name': cat_name,
            'icon': icon
        }

    full_name = item['name']
    if item['notes']:
        full_name = f"{item['name']} ({item['notes']})"

    processed_products.append({
        'name': full_name,
        'category_id': cat_id,
        'price': item['price'],
        'print_type': print_type,
        'stock': None,
        'icon_path': None,
        'is_active': True
    })

print(f"Categorías a insertar: {len(processed_categories)}")
print(f"Productos a insertar: {len(processed_products)}")

with open(r'c:\Users\MSI\OneDrive\Escritorio\proyecto_jobitx\Zorix_Pos\scratch\menu_data.json', 'w', encoding='utf-8') as f:
    json.dump({
        'categories': list(processed_categories.values()),
        'products': processed_products
    }, f, ensure_ascii=False, indent=2)

print("Datos guardados en scratch/menu_data.json")
