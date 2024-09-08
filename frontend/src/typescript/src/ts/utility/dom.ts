class DOM {

    static removeElement(id: string) {
        var elem = document.getElementById(id);
        return elem?.parentNode?.removeChild(elem);
    }

    static getNextSiblingId(elementId: string): string | null {
        const currentElement = document.getElementById(elementId);
        
        if (currentElement && currentElement.nextElementSibling instanceof HTMLElement) {
          return currentElement.nextElementSibling.id;
        }
        
        return null;
      }

    static addElement(
        parentId: string,
        newElement: HTMLElement,
        targetId?: string
      ): void {
        // Find the parent element
        const parentElement = document.getElementById(parentId);
      
        if (!parentElement) {
          console.error(`Parent element with id "${parentId}" not found`);
          return;
        }
      
        if (targetId) {
          // Find the target element within the parent
          const targetElement = parentElement.querySelector(`#${targetId}`);
          if (targetElement) {
            // Insert the new element after the target element
            targetElement.parentNode?.insertBefore(newElement, targetElement.nextSibling);
          } else {
            console.error(`Target element with id "${targetId}" not found within the parent`);
            // Fallback: append to parent if target not found
            parentElement.appendChild(newElement);
          }
        } else {
          // Append the new element as a child of the parent
          parentElement.appendChild(newElement);
        }
      }

      static appendAfter(newNode: HTMLElement, referenceNodeId: string): void {
        let referenceNode = document.getElementById(referenceNodeId);
        if (referenceNode.parentNode) {
          referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
        } else {
          throw new Error("Reference node has no parent");
        }
      }
    
}




export {DOM}