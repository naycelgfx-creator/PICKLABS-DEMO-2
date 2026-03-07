import urllib.request
import json
import os

def download_wiki_svg(filename, out_path, is_commons=False):
    base_url = "https://commons.wikimedia.org" if is_commons else "https://en.wikipedia.org"
    api_url = f"{base_url}/w/api.php?action=query&titles=File:{filename}&prop=imageinfo&iiprop=url&format=json"
    
    req = urllib.request.Request(api_url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            pages = data['query']['pages']
            page_id = list(pages.keys())[0]
            if 'imageinfo' in pages[page_id]:
                url = pages[page_id]['imageinfo'][0]['url']
                print(f"Downloading {url} to {out_path}")
                img_req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(img_req) as img_resp:
                    with open(out_path, 'wb') as f:
                        f.write(img_resp.read())
            else:
                print(f"No imageinfo found for {filename}")
    except Exception as e:
        print(f"Error for {filename}: {e}")

download_wiki_svg('Women%27s_Tennis_Association_logo_(2020).svg', 'public/wta.svg', False)
download_wiki_svg('ATP_Tour_logo.svg', 'public/atp.svg', False)
download_wiki_svg('US_Open_(tennis)_logo.svg', 'public/us-open.svg', False)

download_wiki_svg('NASCAR_Cup_Series_logo.svg', 'public/nascar-cup.svg', True)
download_wiki_svg('NASCAR_Xfinity_Series_logo.svg', 'public/nascar-xfinity.svg', True)
download_wiki_svg('NASCAR_Craftsman_Truck_Series_logo.svg', 'public/nascar-truck.svg', True)

