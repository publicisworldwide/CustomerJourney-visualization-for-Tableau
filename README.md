#  Customer journey visualisation 
**Sunburst diagram** plugin for Tableau JS
This a D3.js viusalisation which can be embedded in Tableau Dashboard as iFrame / WebDataConnector 

**File Structure **
- index.html - Main HTML file including CSS and HTML for the vizualisation 
- Sunburst.js - JS Class including code for the Sunburst diagram in D3.js
- tableau_connector.js - JS wrapper which handles sharing data between dashboard and suburst iframe


**Requirement of the viz:**
In order to work properly the dataset includedn in Tableau should have:
- "CJ Full String" column including the whole path
- "Relevance" column describing how often does the journey occur

In order to use this connector you need to do:

1. Connect with the Tableau Server per RDP
2. Move all the above mentioned file to Tableau Server
3. Import all the files to the webdataconnectors folder of tableau using follwing commands in Powershell:
    - `tabadmin import_webdataconnector ./index.html`
    - `tabadmin import_webdataconnector ./Sunburst.js`
    - `tabadmin import_webdataconnector ./tableau_connector.js`
4. Copy the returned URL for index.html which should be in following form:
   - `http://<HOST>/#/web_dataconnectors/index.html`
5. Add WebView to the dashboard and past there the copied link 

![Alt text](http://full/path/to/img.jpg "Paste the copied link here!")

### Development

![Alt text](http://full/path/to/img.jpg "Best practises in development ")

### FAQ
- Q: Does it work with Tableau Public ? 
  A: No, unfortunately it requires changes to be made on behalf of Tableau Server thus it won't work with Tableau Public 
  
- Q: Can you interact with the visualisation on Desktop i.e Tableau Reader ?
  A: No, It won't work. In order to use it you need to publish the dashboard with iframe to the server
