// Global variable to store the Cytoscape instance
let cy = null;
const drawn = new Set(); // Track drawn edges for undirected graph
// Track visited nodes globally to persist their darkened state
let visitedNodes = new Set();

window.onload = async function () {
    console.log("Page loaded: Clearing old graph");
    await fetch("/clear_graph");
    // Initialize Cytoscape with an empty graph
    cy = cytoscape({
        container: document.getElementById('cy'),
        elements: [], // Start with no elements
        style: [
            { 
                selector: 'node', 
                style: { 
                    'background-color': '#b3d4b2', // Muted green node background
                    'label': 'data(id)', // Display the node ID
                    'color': '#293629', // Dark green label text
                    'text-valign': 'center', 
                    'font-size': '12px',
                    'width': '30px', // Larger node size
                    'height': '30px' // Larger node size
                } 
            },
            { 
                selector: 'edge', 
                style: { 
                    'width': 3, 
                    'line-color': '#2c3e50', 
                    'label': 'data(weight)', // Display the edge weight as a label
                    'color': '#293629', // Dark green label text (matches nodes)
                    'text-margin-y': 20, // Offset the label above the edge
                    'text-halign': 'center',
                    'text-valign': 'center',
                    'text-rotation': 'autorotate', // Rotate label to follow the edge
                    'font-size': '12px' // Match node label size for consistency
                } 
            }
        ],
        layout: { 
            name: 'circle', 
            fit: true, 
            padding: 75, 
            spacingFactor: 0.75 // Decrease spacing by 25% (tighter nodes)
        }
    });
};

document.getElementById("graph-form").addEventListener("submit", async function (event) {
    console.log("Submitting graph input");
    event.preventDefault();
    const graph_as_input = document.getElementById("graph").value;
    try {
        const response = await fetch("/submit_graph", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ graph: graph_as_input })
        });
        graph_as_json = await response.json(); // Get result from fetch call
        //document.getElementById("output").innerText = JSON.stringify(graph_as_json, null, 2);
        document.getElementById("output").innerText = "Graph successfully recieved!"
        // Clear existing elements and add new ones from the JSON with edge weights as undirected
        cy.elements().remove();
        const elements = [];
        Object.keys(graph_as_json.graph).forEach(node => elements.push({ data: { id: node } }));
        
        Object.entries(graph_as_json.graph).forEach(([from, neighbors]) => {
            console.log(from);
            console.log(neighbors);
            neighbors.forEach(to => {
                const fromNum = Number(from);
                const toNum = Number(to[0]); // Convert to numbers for consistent comparison
                const edgeId = `${from}-${to[0]}`;
                const reverseEdgeId = `${to[0]}-${from}`;

                // Ensure undirected by adding both directions only if not already drawn
                if (!drawn.has([fromNum, toNum].sort().join('-'))) {
                    elements.push({ data: { id: edgeId, source: from, target: to[0], weight: to[1] } });
                    elements.push({ data: { id: reverseEdgeId, source: to[0], target: from, weight: to[1] } });
                    drawn.add([fromNum, toNum].sort().join('-')); // Use sorted pair as key to prevent duplicates
                    drawn.add([toNum, fromNum].sort().join('-')); // Ensure reverse direction is tracked
                }
            });
        });
        
        cy.add(elements);
        // Reset visited nodes and drawn edges when loading a new graph
        visitedNodes.clear();
        drawn.clear(); // Clear drawn set to start fresh with new graph

        // Apply layout with animation and custom spacing
        cy.layout({ 
            name: 'circle', 
            animate: true, 
            animationDuration: 500, 
            fit: true, 
            padding: 75, 
            spacingFactor: 0.75 // Consistent spacing
        }).run();
    } catch (error) {
        document.getElementById("output").innerText = "Error submitting the graph.";
    }
});

document.getElementById("add-node").addEventListener("click", async function () {
    console.log("Clicked add-node button: Adding new node to graph");
    try {
        const new_graph = await fetch("/add_node_to_graph");
        graph_as_json = await new_graph.json();
        const newNode = Object.keys(graph_as_json.graph).pop(); // Get the newly added node

        // Add the new node with an initial position (no weight, as weights are for edges)
        cy.add({
            data: { id: newNode },
            position: { x: cy.width() / 2, y: cy.height() / 2 } // Center initially
        });

        // Re-run layout to adjust positions with animation and custom spacing
        cy.layout({ 
            name: 'circle', 
            animate: true, 
            animationDuration: 500, 
            fit: true, 
            padding: 75, 
            spacingFactor: 0.75 // Consistent spacing
        }).run();

        document.getElementById("output").innerText = "Successfully added node!";
    } catch (error) {
        document.getElementById("output").innerText = "Error adding node.";
    }
});

document.getElementById("add-edge").addEventListener("click", async function () {
    console.log("Clicked add-edge button: Adding new edge between nodes");
    const ef_as_input = document.getElementById("from-node").value;
    const et_as_input = document.getElementById("to-node").value;
    const weight_as_input = document.getElementById("weight").value || 0; // Add an input for weight in HTML, default to 0 if empty

    try {
        const new_graph = await fetch("/add_edge_to_graph", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ "ef": ef_as_input, "et": et_as_input, "weight": Number(weight_as_input) }) // Send weight to backend
        });
        edgeId = `${ef_as_input}-${et_as_input}`;
        reversedId = `${et_as_input}-${ef_as_input}`
        edgeElement = cy.getElementById(edgeId);
        reversedElement = cy.getElementById(reversedId);
        console.log(edgeElement);
        console.log(reversedElement);
        if(edgeElement && edgeElement.isEdge()) {
            edgeElement.data('weight', Number(weight_as_input));
        } if (reversedElement && reversedElement.isEdge()) {
            reversedElement.data('weight', Number(weight_as_input));
        } if (!(edgeElement && edgeElement.isEdge()) && !(reversedElement && reversedElement.isEdge())) {
            cy.add({ data: { id: edgeId, source: ef_as_input, target: et_as_input, weight: Number(weight_as_input) } });
            //cy.add({ data: { id: reverseEdgeId, source: et_as_input, target: ef_as_input, weight: Number(weight_as_input) } });
        }
         
        document.getElementById("output").innerText = `Successfully added undirected edge ${edgeId} with weight ${weight_as_input}`;
    } catch (error) {
        document.getElementById("output").innerText = "Error when adding or updating edges";
    }
});

document.getElementById("visualization-form").addEventListener("submit", async function (event) {
    console.log("Entered: run-visualization");
    event.preventDefault();
    const selected_algorithm = document.getElementById("algorithm").value;
    animateTraversal(selected_algorithm, cy); // Use existing cy instance
});

async function resetNodes(traversalOrder) {
    for (var i = 0; i < traversalOrder.length; i++) {
        const currentNode = cy.getElementById(traversalOrder[i]);
        currentNode.style({ 'background-color': '#b3d4b2' });
    }
    
    // Clear visited nodes after resetting
    visitedNodes.clear();
}

// Generalized animateTraversal function for different graph algorithms
async function animateTraversal(algorithm, cy) {
    console.log("Entering animateTraversal: Animating traversal now");
    if (algorithm != "mst") {
        const response = await fetch("/run_algorithm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ "algorithm": algorithm })
        });
        
        const result = await response.json();
        const traversalOrder = result.result;
        console.log(traversalOrder);
        document.getElementById("output").innerText = traversalOrder;
        await resetNodes(traversalOrder);

        if (traversalOrder) {
            animateGraphTraversal(cy, traversalOrder);
        }
    } else {
        const response = await fetch("/run_mst");
        const result = await response.json()
        console.log(result.result);
        console.log(JSON.stringify(result));
        console.log("done mst!");
        if (result) {
            animateAddingEdges(cy, result.result)
        }
    }
}

function animateAddingEdges(cy, edgeOrder) {
    console.log("Animating adding edges");
    let step = 0;

    function animateStep(color) {
        console.log("In animation step");
        if (step < edgeOrder.length) {
            // Get node IDs and ensure they’re strings for Cytoscape
            const fromId = String(edgeOrder[step][0]); // Convert to string
            const toId = String(edgeOrder[step][1]);   // Convert to string
            const fromNode = cy.getElementById(fromId);
            const toNode = cy.getElementById(toId);

            // Check if nodes exist
            if (!fromNode || !toNode) {
                console.warn(`Node not found: from=${fromId}, to=${toId}`);
                step++;
                setTimeout(animateStep, 1000); // 1s delay, continue to next step
                return;
            }

            // Generate edge ID for undirected graph (sort for consistency)
            const edgeIds = [fromId, toId]
            const edgeIds2 = [toId, fromId]
            const edgeId = edgeIds.join('-');
            const edgeId2 = edgeIds2.join('-');
            const edgeElement = cy.getElementById(edgeId);
            const edgeElement2 = cy.getElementById(edgeId2);
            // Check if edge exists and is an edge before styling
            if (edgeElement && edgeElement.isEdge()) {
                // Set edge color to red (no animation)
                edgeElement.style({ 'line-color': color });
                console.log(`Highlighted edge ${edgeId} in red`);
            } 
            if (edgeElement2 && edgeElement2.isEdge()) {
                edgeElement2.style({ 'line-color': color });
                console.log(`Highlighted edge ${edgeId2} in red`);
            }
            else {
                console.warn(`Edge ${edgeId} not found in graph`);
            }

            step++;
            setTimeout(animateStep, 1000); // 1s delay between steps
        }
    }

    animateStep('#34a1eb');
    
}

// Function to animate graph traversal (highlight nodes one by one)
function animateGraphTraversal(cy, traversalOrder) {
    let step = 0;

    function animateStep() {
        // Highlight the current node
        const currentNode = cy.getElementById(traversalOrder[step]);
        if (step - 1 >= 0) {
            const prevNode = cy.getElementById(traversalOrder[step - 1]);
            prevNode.style({'background-color': '#577056' });
        }
            
        currentNode.style({ 'background-color': '#59e854' }); // Highlight with red for contrast

        if (step < traversalOrder.length - 1) {
            step++;
            setTimeout(animateStep, 1000); // 1s delay
        }
    }

    animateStep();


}

// Function to fetch and draw initial graph (called on load or form submission)
async function fetchGraphAndDraw() {
    console.log("Entering fetchGraphAndDraw");
    const response = await fetch("/get_graph");
    const data = await response.json();
    const graph = data.graph;
    const elements = [];

    Object.keys(graph).forEach(node => elements.push({ data: { id: node } }));
    
    Object.entries(graph).forEach(([from, neighbors]) => {
        neighbors.forEach((to, w) => {
            const fromNum = Number(from);
            const toNum = Number(to[0]); // Convert to numbers for consistent comparison
            const edgeId = `${from}-${to[0]}`;
            const reverseEdgeId = `${to[0]}-${from}`;

            // Ensure undirected by adding both directions only if not already drawn
            if (!drawn.has([fromNum, toNum].sort().join('-'))) {
                elements.push({ data: { id: edgeId, source: from, target: to[0], weight: w } });
                elements.push({ data: { id: reverseEdgeId, source: to[0], target: from, weight: w } });
                drawn.add([fromNum, toNum].sort().join('-')); // Use sorted pair as key to prevent duplicates
                drawn.add([toNum, fromNum].sort().join('-')); // Ensure reverse direction is tracked
            }
        });
    });

    cy.elements().remove();
    cy.add(elements);
    cy.layout({ 
        name: 'circle', 
        animate: true, 
        animationDuration: 500, 
        fit: true, 
        padding: 75, 
        spacingFactor: 0.75 // Consistent spacing
    }).run();

    return cy;
}