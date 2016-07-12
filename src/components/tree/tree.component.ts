import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    Output,
    EventEmitter,
    HostBinding,
    Input,
    Optional,
    OnInit,
    OnDestroy
} from '@angular/core';

import {
    ArgumentHelper
} from '../../utils';

import {
    TreeService
} from './tree.service';

import {
    TreeNode,
    TreeOptions,
    TreeEvent,
    TREE_TYPES,
    TREE_TYPE_LIST
} from './';

/**
 * Angular Wrapper for the SoHo Tree Component.
 *
 * This component searches for an unordered list (ul) with the attribute
 * 'soho-tree' in the parent's DOM tree, initialising those found with
 * the SoHo tree control.
 *
 * The data is provided either by the content (li elements), a dataset
 * input or an implementation of the TreeService interface, by specifying
 * an implementation on the hosting component, e.g.
 *
 * providers: [ provide: TreeService, useClass: TreeDemoService} ]
 *
 * @todo
 *
 * 1) Content based version does not work due to lack of TreeNode.
 * 2) Complete interface definition
 */
@Component({
    moduleId: module.id,
    selector: 'ul[soho-tree]', // @todo component or directive (like)
    template: '<ng-content></ng-content>',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SoHoTreeComponent implements AfterViewInit, OnInit, OnDestroy {

    // -------------------------------------------
    // Component Inputs
    // -------------------------------------------

    // The array of root tree nodes to display.
    @Input() set dataset(dataset: TreeNode[]) {
        // @todo this is not fully working as the tree control does not
        // replace the contents but looks to merge it.
        this._dataset = dataset;
        if (this.tree) {
            this.tree.loadData(dataset);
        }
    };

    // Controls the the type of the tree node.
    @Input('soho-tree') set sohoTree(treeType: string) {
        if (TREE_TYPE_LIST.includes(treeType)) {
            this.treeType = treeType;
        } else if (treeType) {
            throw Error(`'${treeType}' is not valid, it must be one of ${TREE_TYPE_LIST}.`);
        } else {
            this.treeType = TREE_TYPES.AUTO;
        }
    }

    // -------------------------------------------
    // Component Output
    // -------------------------------------------

    // This event is fired when a node is expanded, the TreeNode
    // expanded is passed as an argument to the handler.
    @Output() expand = new EventEmitter<TreeNode>();

    // This event is fired when a node is collapsed, the TreeNode
    // collapsed is passed as an argument to the handler.
    @Output() collapse = new EventEmitter<TreeNode>();

    // This event is fired when a node is selected, the TreeNode
    // selected is passed as an argument to the handler.
    @Output() selected = new EventEmitter<TreeNode>();

    // -------------------------------------------
    // Host Bindings
    // -------------------------------------------

    // Set the enable / disabled class (not working)
    @HostBinding('class.is-disabled') isDisabled = false;

    // Set the appropriate SoHo class for a tree.
    @HostBinding('class') treeClass = 'tree';

    // Set the role.
    @HostBinding('attr.role') treeRole = 'tree';

    // -------------------------------------------
    // Private Member Data
    // -------------------------------------------

    // Reference to the jQuery control.
    private jQueryElement: any;

    // Reference to the SoHo tree control api.
    private tree: any;

    // Loaded dataset (root tree nodes)
    private _dataset: TreeNode[];

    // The tree's type.
    private treeType: string;

    /**
     * Constructor.
     *
     * @param elementRef - the element matching this directive.
     * @param treeService - service for obtaining data (optional)
     */
    constructor(
        private elementRef: ElementRef,
        @Optional() private treeService: TreeService) {
    }

    // -------------------------------------------
    // Public API
    // -------------------------------------------

    public enable(): void {
        // @todo not working on SoHo tree control
        this.isDisabled = false;
    }

    public disable(): void {
        // @todo not working on SoHo tree control
        this.isDisabled = true;
    }

    public setFocus(node: TreeNode) {
        ArgumentHelper.checkNotNull('node', node);

        this.tree.setFocus(node);
    }

    public disableNode(node: TreeNode) {
        ArgumentHelper.checkNotNull('node', node);

        node.disabled = true;
        this.tree.updateNode(node);
    }

    public enableNode(node: TreeNode): void {
        ArgumentHelper.checkNotNull('node', node);

        node.disabled = false;
        this.tree.updateNode(node);
    }

    /**
     * Updates the note with the information in the given TreeNode.
     *
     * @parm node the tree node; must not be null.
     */
    public updateNode(node: TreeNode): void {
        ArgumentHelper.checkNotNull('node', node);

        this.tree.updateNode(node);
    }

    /**
     * Expands all the loaded tree nodes.
     *
     * Note: this does not load additional nodes.
     */
    public expandAll() {
        if (this.tree) {
            this.tree.expandAll();
        }
    }

    /**
     * Collapse all the tree nodes.
     */
    public collapseAll() {
        if (this.tree) {
            this.tree.collapseAll();
        }
    }

    public removeNode(node: TreeNode) {
        if (this.tree) {
            this.tree.removeNode(node);
        }
    }

    /**
     * Set the selected note based in the id of the node.
     */
    public setSelectedNode(id: string, focus = true) {
        ArgumentHelper.checkNotEmpty('id', id);

        let treeNode: TreeNode = this.tree.findById(id);
        if (treeNode) {
            if (!treeNode.open && focus) {
                this.tree.toggleNode(treeNode.node);
            }
            this.tree.setSelectedNode(treeNode.node, focus);
        }
    }

    public getSelectedNode(): TreeNode {
        // @todo not working - no api.
        let node = this.jQueryElement.find('.is-selected');
        return node.jsonData();
    }

    /**
     * Adds a node to the tree.
     */
    public addNode(treeNode: TreeNode, location: any = 'bottom') {
        ArgumentHelper.checkNotNull('treeNode', treeNode);

        this.tree.addNode(treeNode, location);
    }

    /**
     * Find the tree node for the given identifier (id).
     */
    public findById(id: string): TreeNode {
        ArgumentHelper.checkNotEmpty('id', id);

        return this.tree.findById(id);
    }

    /**
     * Toggles open/closed state of the given tree node.
     */
    public toggleNode(node: TreeNode) {
        ArgumentHelper.checkNotNull('node', node);
        ArgumentHelper.checkNotNull('node.node', node.node);

        this.tree.toggleNode(node.node);
    }

    // -------------------------------------------
    // Event Handlers
    // -------------------------------------------

    /**
     * Handle a request to load the children of the specified node.
     *
     * event - the tree event used to determine which node to load
     * response - function used to return the children
     */
    private onDataRequest(event: TreeEvent, response: (data: any) => void) {
        let node: TreeNode = event.data;

        this.treeService.getTreeNodes(node)
            .subscribe((children: TreeNode[]) => {
                response(children);
            });
    }

    // ------------------------------------------
    // Lifecycle Events
    // ------------------------------------------

    ngOnInit() {
    }

    ngAfterViewInit() {
        // Wrap the "unordered list" element in a jQuery selector.
        this.jQueryElement = jQuery(this.elementRef.nativeElement);

        // The source is used to lazily load the tree.
        let options: TreeOptions = {
            dataset: this._dataset,
            source: (this.treeService && this.treeType !== TREE_TYPES.CONTENT_ONLY)
            ? (args: TreeEvent, response: any) => this.onDataRequest(args, response) : null
        };

        // Initialise the SoHo control.
        this.jQueryElement.tree(options);

        // Once the control is initialised, extract the control
        // plug-in from the element.  The element name is
        // defined by the plug-in, but in this case it is 'tree'.
        this.tree = this.jQueryElement.data('tree');

        // Preload from the service if specified (unless data already provided).
        if (this.treeType !== TREE_TYPES.CONTENT_ONLY && !this.dataset && this.treeService) {
            // ... bootstrap ...
            this.treeService.getRootTreeNodes()
                .subscribe((dataset: TreeNode[]) => this.dataset = dataset);
        }

        // Initialize any event handlers.
        this.jQueryElement
            .on('selected', (e: any, args: TreeEvent) => this.selected.next(args.data))
            .on('expand', (e: any, args: TreeEvent) => this.expand.next(args.data))
            .on('collapse', (e: any, args: TreeEvent) => this.collapse.next(args.data));
    }

    ngOnDestroy() {
        if (this.jQueryElement) {
            this.jQueryElement.destroy();
            this.jQueryElement = null;
        }
    }
}
