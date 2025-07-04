const { useState, useEffect } = React;
const { Upload, Download, Eye, Ruler, Package, Settings, ChevronRight, Loader } = lucide;

// Configuration
const CONFIG = {
  API_BASE: window.location.hostname === 'localhost' 
    ? '/api' 
    : '/.netlify/functions/dielines-proxy',
  SANDBOX_API: 'https://sandbox.api.diecuttemplates.com',
  API_KEY: '340406f22a2b481ca67681546d79cfed'
};

const WebToPrint3DMaker = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateData, setTemplateData] = useState(null);
  const [variables, setVariables] = useState({});
  const [customDieline, setCustomDieline] = useState(null);
  const [mockup3D, setMockup3D] = useState(null);
  const [artworkFile, setArtworkFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiMode, setApiMode] = useState('demo');

  // Template categories
  const templateCategories = [
    {
      id: 'cartons_tuck_end_boxes',
      name: 'Tuck End Boxes',
      category: 'Cartons',
      templates: [
        { id: 'becf-10301', name: 'Standard Tuck End Box', description: 'Classic tuck end box design' },
        { id: 'becf-10307', name: 'Friction Fit Tuck Box', description: 'Self-locking tuck end design' },
      ]
    },
    {
      id: 'cartons_food_boxes',
      name: 'Food Boxes',
      category: 'Cartons',
      templates: [
        { id: 'becf-11f08', name: 'Food Service Box', description: 'Food packaging design' }
      ]
    }
  ];

  // Enhanced mock template data
  const mockTemplateData = {
    'becf-10301': {
      "type": "dieline_template",
      "id": "becf-10301",
      "group": {
        "type": "dieline_template_group",
        "id": "cartons_tuck_end_boxes",
        "name": "Tuck End Boxes",
        "category": "Cartons"
      },
      "variables": [
        {
          "type": "dieline_template_variable",
          "name": "length",
          "description": "Length of the box",
          "data_type": "length",
          "required": true,
          "default_value": { "value": 100, "unit": "mm" }
        },
        {
          "type": "dieline_template_variable", 
          "name": "width",
          "description": "Width of the box",
          "data_type": "length",
          "required": true,
          "default_value": { "value": 60, "unit": "mm" }
        },
        {
          "type": "dieline_template_variable",
          "name": "height", 
          "description": "Height of the box",
          "data_type": "length",
          "required": true,
          "default_value": { "value": 80, "unit": "mm" }
        },
        {
          "type": "dieline_template_variable",
          "name": "material",
          "description": "Material thickness",
          "data_type": "length", 
          "required": true,
          "default_value": { "value": 1.5, "unit": "mm" }
        },
        {
          "type": "dieline_template_variable",
          "name": "overflow",
          "description": "Add bleed area",
          "data_type": "boolean",
          "required": false,
          "default_value": { "value": false }
        }
      ]
    },
    'becf-10307': {
      "type": "dieline_template",
      "id": "becf-10307",
      "group": {
        "type": "dieline_template_group",
        "id": "cartons_tuck_end_boxes",
        "name": "Tuck End Boxes",
        "category": "Cartons"
      },
      "variables": [
        {
          "type": "dieline_template_variable",
          "name": "length",
          "description": "Box length",
          "data_type": "length",
          "required": true,
          "default_value": { "value": 120, "unit": "mm" }
        },
        {
          "type": "dieline_template_variable", 
          "name": "width",
          "description": "Box width",
          "data_type": "length",
          "required": true,
          "default_value": { "value": 80, "unit": "mm" }
        },
        {
          "type": "dieline_template_variable",
          "name": "height", 
          "description": "Box height",
          "data_type": "length",
          "required": true,
          "default_value": { "value": 100, "unit": "mm" }
        },
        {
          "type": "dieline_template_variable",
          "name": "material",
          "description": "Material thickness",
          "data_type": "length", 
          "required": true,
          "default_value": { "value": 2.0, "unit": "mm" }
        },
        {
          "type": "dieline_template_variable",
          "name": "flap_size",
          "description": "Tuck flap size",
          "data_type": "length",
          "required": false,
          "default_value": { "value": 15, "unit": "mm" }
        }
      ]
    },
    'becf-11f08': {
      "type": "dieline_template",
      "id": "becf-11f08",
      "group": {
        "type": "dieline_template_group",
        "id": "cartons_food_boxes",
        "name": "Food Boxes",
        "category": "Cartons"
      },
      "variables": [
        {
          "type": "dieline_template_variable",
          "name": "length",
          "description": "Container length",
          "data_type": "length",
          "required": true,
          "default_value": { "value": 150, "unit": "mm" }
        },
        {
          "type": "dieline_template_variable", 
          "name": "width",
          "description": "Container width",
          "data_type": "length",
          "required": true,
          "default_value": { "value": 100, "unit": "mm" }
        },
        {
          "type": "dieline_template_variable",
          "name": "height", 
          "description": "Container height",
          "data_type": "length",
          "required": true,
          "default_value": { "value": 50, "unit": "mm" }
        },
        {
          "type": "dieline_template_variable",
          "name": "material",
          "description": "Food-grade material thickness",
          "data_type": "length", 
          "required": true,
          "default_value": { "value": 0.5, "unit": "mm" }
        }
      ]
    }
  };

  // API Helper function
  const apiCall = async (endpoint, options = {}) => {
    try {
      // Try backend proxy first
      const response = await fetch(`${CONFIG.API_BASE}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.log('Backend proxy failed, using demo mode:', error);
    }
    
    return null;
  };

  // Fetch template details
  const fetchTemplateDetails = async (templateId) => {
    setLoading(true);
    setError(null);
    
    const data = await apiCall(`/dieline-templates/mm/${templateId}`);
    
    if (data) {
      setTemplateData(data.dieline_template);
      setApiMode('live');
      
      const defaultVars = { unit: 'mm' };
      data.dieline_template.variables.forEach(variable => {
        if (variable.default_value) {
          defaultVars[variable.name] = variable.default_value.value;
        }
      });
      setVariables(defaultVars);
    } else {
      // Fallback to demo data
      const mockData = mockTemplateData[templateId];
      if (mockData) {
        setTemplateData(mockData);
        setApiMode('demo');
        const defaultVars = { unit: 'mm' };
        mockData.variables.forEach(variable => {
          if (variable.default_value) {
            defaultVars[variable.name] = variable.default_value.value;
          }
        });
        setVariables(defaultVars);
      } else {
        setError('Template not found');
      }
    }
    
    setLoading(false);
  };

  // Create custom dieline
  const createDieline = async () => {
    if (!templateData) return;
    
    setLoading(true);
    setError(null);
    
    const data = await apiCall(`/dieline-templates/${templateData.id}/dielines`, {
      method: 'POST',
      body: JSON.stringify({
        format: 'pdf',
        area: true,
        variables: variables
      })
    });

    if (data) {
      setCustomDieline(data.dieline);
      setCurrentStep(3);
    } else {
      // Demo dieline simulation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const dielineId = `di_${Math.random().toString(36).substr(2, 12)}`;
      const artworkWidth = Math.round((variables.length || 100) * 2.8 + (variables.width || 60) * 2);
      const artworkHeight = Math.round((variables.width || 60) * 2.5 + (variables.height || 80) * 2);
      
      const surfaceArea = ((variables.length || 100) * (variables.width || 60) * 2) + 
                         ((variables.length || 100) * (variables.height || 80) * 2) + 
                         ((variables.width || 60) * (variables.height || 80) * 2);
      
      const dieline = {
        "type": "dieline",
        "id": dielineId,
        "dieline_template_id": templateData.id,
        "variables": variables,
        "format": "pdf",
        "url": `${CONFIG.SANDBOX_API}/dielines/${dielineId}.pdf`,
        "artwork_dimensions": {
          "unit": variables.unit || "mm",
          "width": artworkWidth.toString(),
          "height": artworkHeight.toString()
        },
        "area": {
          "value": surfaceArea,
          "unit": `${variables.unit || 'mm'}2`
        },
        "created_at": new Date().toISOString()
      };
      
      setCustomDieline(dieline);
      setCurrentStep(3);
    }
    
    setLoading(false);
  };

  // Create 3D mockup
  const create3DMockup = async () => {
    if (!customDieline) return;
    
    setLoading(true);
    setError(null);
    
    if (apiMode === 'live' && artworkFile) {
      const formData = new FormData();
      formData.append('file', artworkFile);
      formData.append('name', `Custom 3D Mockup - ${artworkFile.name}`);
      formData.append('outside_design', 'true');

      const data = await apiCall(`/dielines/${customDieline.id}/3d-mockups`, {
        method: 'POST',
        body: formData
      });

      if (data) {
        setMockup3D(data["3d_mockup"]);
        setCurrentStep(4);
        setLoading(false);
        return;
      }
    }
    
    // Demo 3D mockup simulation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockupId = `mockup_${Math.random().toString(36).substr(2, 10)}`;
    const mockupUrl = `${CONFIG.SANDBOX_API}/3d/${mockupId}`;
    
    const mockup = {
      "type": "3d_mockup",
      "id": mockupId,
      "url": mockupUrl,
      "name": artworkFile ? `Custom 3D Mockup - ${artworkFile.name}` : "Custom 3D Mockup",
      "dieline": customDieline
    };
    
    setMockup3D(mockup);
    setCurrentStep(4);
    setLoading(false);
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    fetchTemplateDetails(template.id);
    setCurrentStep(2);
  };

  const handleVariableChange = (name, value) => {
    setVariables(prev => ({
      ...prev,
      [name]: parseFloat(value) || value
    }));
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setArtworkFile(file);
    }
  };

  const StepIndicator = ({ step, currentStep, title }) => (
    React.createElement('div', {
      className: `flex items-center ${step <= currentStep ? 'text-blue-600' : 'text-gray-400'}`
    },
      React.createElement('div', {
        className: `w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          step < currentStep ? 'bg-blue-600 text-white' : 
          step === currentStep ? 'bg-blue-100 text-blue-600 border-2 border-blue-600' : 
          'bg-gray-200'
        }`
      }, step),
      React.createElement('span', { className: 'ml-2 font-medium' }, title),
      step < 4 && React.createElement(ChevronRight, { className: 'ml-4 w-4 h-4' })
    )
  );

  return React.createElement('div', { className: 'min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100' },
    React.createElement('div', { className: 'container mx-auto px-4 py-8' },
      // Header
      React.createElement('div', { className: 'text-center mb-12 fade-in' },
        React.createElement('h1', { className: 'text-4xl font-bold text-gray-900 mb-4' },
          'Web-to-Print 3D Item Maker'
        ),
        React.createElement('p', { className: 'text-xl text-gray-600 max-w-2xl mx-auto mb-4' },
          'Create custom packaging designs with parametric dielines and real-time 3D previews'
        ),
        React.createElement('div', {
          className: `border px-4 py-3 rounded-lg max-w-2xl mx-auto ${
            apiMode === 'live' 
              ? 'bg-green-100 border-green-400 text-green-800' 
              : 'bg-blue-100 border-blue-400 text-blue-800'
          }`
        },
          React.createElement('p', { className: 'text-sm' },
            apiMode === 'live' 
              ? React.createElement(React.Fragment, null,
                  React.createElement('strong', null, 'Live API Mode:'), ' Connected to sandbox API endpoint'
                )
              : React.createElement(React.Fragment, null,
                  React.createElement('strong', null, 'Demo Mode:'), ' Using enhanced simulation data (API connection failed)'
                )
          )
        )
      ),

      // Step Indicator
      React.createElement('div', { className: 'flex justify-center mb-12' },
        React.createElement('div', { className: 'flex items-center space-x-4 bg-white rounded-lg p-6 shadow-lg' },
          React.createElement(StepIndicator, { step: 1, currentStep: currentStep, title: 'Select Template' }),
          React.createElement(StepIndicator, { step: 2, currentStep: currentStep, title: 'Configure' }),
          React.createElement(StepIndicator, { step: 3, currentStep: currentStep, title: 'Upload Artwork' }),
          React.createElement(StepIndicator, { step: 4, currentStep: currentStep, title: 'Generate Files' })
        )
      ),

      // Error Display
      error && React.createElement('div', { className: 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6' },
        error
      ),

      // Step 1: Template Selection
      currentStep === 1 && React.createElement('div', { className: 'max-w-4xl mx-auto fade-in' },
        React.createElement('h2', { className: 'text-2xl font-bold text-gray-900 mb-6' }, 'Choose a Template'),
        React.createElement('div', { className: 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' },
          templateCategories.map(category =>
            React.createElement('div', { key: category.id, className: 'bg-white rounded-lg shadow-lg overflow-hidden' },
              React.createElement('div', { className: 'p-6 border-b border-gray-200' },
                React.createElement('h3', { className: 'text-lg font-semibold text-gray-900' }, category.name),
                React.createElement('p', { className: 'text-sm text-gray-600' }, category.category)
              ),
              React.createElement('div', { className: 'p-6' },
                category.templates.map(template =>
                  React.createElement('button', {
                    key: template.id,
                    onClick: () => handleTemplateSelect(template),
                    className: 'w-full text-left p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors mb-3 last:mb-0'
                  },
                    React.createElement('h4', { className: 'font-medium text-gray-900' }, template.name),
                    React.createElement('p', { className: 'text-sm text-gray-600 mt-1' }, template.description)
                  )
                )
              )
            )
          )
        )
      )

      // Add the rest of the steps here...
      // (I'll continue in the next message due to length)
    )
  );
};

// Render the app
ReactDOM.render(React.createElement(WebToPrint3DMaker), document.getElementById('root'));
