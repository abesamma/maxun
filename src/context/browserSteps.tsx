import React, { createContext, useContext, useState } from 'react';

export interface TextStep {
    id: number;
    type: 'text';
    label: string;
    data: string;
    isShadow?: boolean;
    selectorObj: SelectorObject;
    actionId?: string;
}

interface ScreenshotStep {
    id: number;
    type: 'screenshot';
    fullPage: boolean;
    actionId?: string;
    screenshotData?: string;
}

export interface ListStep {
    id: number;
    type: 'list';
    listSelector: string;
    isShadow?: boolean;
    fields: { [key: string]: TextStep };
    pagination?: {
        type: string;
        selector: string;
        isShadow?: boolean;
    };
    limit?: number;
    actionId?: string;
}

export type BrowserStep = TextStep | ScreenshotStep | ListStep;

export interface SelectorObject {
    selector: string;
    tag?: string;
    attribute?: string;
    isShadow?: boolean;
    [key: string]: any;
}

interface BrowserStepsContextType {
    browserSteps: BrowserStep[];
    addTextStep: (label: string, data: string, selectorObj: SelectorObject, actionId: string) => void;
    addListStep: (listSelector: string, fields: { [key: string]: TextStep }, listId: number, actionId: string, pagination?: { type: string; selector: string, isShadow?: boolean }, limit?: number, isShadow?: boolean) => void
    addScreenshotStep: (fullPage: boolean, actionId: string) => void;
    deleteBrowserStep: (id: number) => void;
    updateBrowserTextStepLabel: (id: number, newLabel: string) => void;
    updateListTextFieldLabel: (listId: number, fieldKey: string, newLabel: string) => void;
    updateListStepLimit: (listId: number, limit: number) => void;
    updateListStepData: (listId: number, extractedData: any[]) => void;
    removeListTextField: (listId: number, fieldKey: string) => void;
    deleteStepsByActionId: (actionId: string) => void;
    updateScreenshotStepData: (id: number, screenshotData: string) => void;
}

const BrowserStepsContext = createContext<BrowserStepsContextType | undefined>(undefined);

export const BrowserStepsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [browserSteps, setBrowserSteps] = useState<BrowserStep[]>([]);
    const [discardedFields, setDiscardedFields] = useState<Set<string>>(new Set());

    const addTextStep = (label: string, data: string, selectorObj: SelectorObject, actionId: string) => {
        setBrowserSteps(prevSteps => [
            ...prevSteps,
            { id: Date.now(), type: 'text', label, data, selectorObj, actionId }
        ]);
    };

    const addListStep = (
        listSelector: string, 
        newFields: { [key: string]: TextStep }, 
        listId: number, 
        actionId: string, 
        pagination?: { type: string; selector: string; isShadow?: boolean }, 
        limit?: number,
        isShadow?: boolean
    ) => {
        setBrowserSteps(prevSteps => {
            const existingListStepIndex = prevSteps.findIndex(step => step.type === 'list' && step.id === listId);
            
            if (existingListStepIndex !== -1) {
                const updatedSteps = [...prevSteps];
                const existingListStep = updatedSteps[existingListStepIndex] as ListStep;

                // Preserve existing labels for fields
                const mergedFields = Object.entries(newFields).reduce((acc, [key, field]) => {
                    if (!discardedFields.has(`${listId}-${key}`)) {
                        // If field exists, preserve its label
                        if (existingListStep.fields[key]) {
                            acc[key] = {
                                ...field,
                                label: existingListStep.fields[key].label,
                                actionId
                            };
                        } else {
                            acc[key] = {
                                ...field,
                                actionId
                            };
                        }
                    }
                    return acc;
                }, {} as { [key: string]: TextStep });

                updatedSteps[existingListStepIndex] = {
                    ...existingListStep,
                    fields: mergedFields,
                    pagination: pagination || existingListStep.pagination,
                    limit: limit,
                    actionId,
                    isShadow: isShadow !== undefined ? isShadow : existingListStep.isShadow
                };
                return updatedSteps;
            } else {
                const fieldsWithActionId = Object.entries(newFields).reduce((acc, [key, field]) => {
                    acc[key] = {
                        ...field,
                        actionId
                    };
                    return acc;
                }, {} as { [key: string]: TextStep });

                return [
                    ...prevSteps,
                    { 
                        id: listId, 
                        type: 'list', 
                        listSelector, 
                        fields: fieldsWithActionId, 
                        pagination, 
                        limit, 
                        actionId,
                        isShadow
                    }
                ];
            }
        });
    };

    const addScreenshotStep = (fullPage: boolean, actionId: string) => {
        setBrowserSteps(prevSteps => [
            ...prevSteps,
            { id: Date.now(), type: 'screenshot', fullPage, actionId }
        ]);
    };

    const deleteBrowserStep = (id: number) => {
        setBrowserSteps(prevSteps => prevSteps.filter(step => step.id !== id));
    };

    const deleteStepsByActionId = (actionId: string) => {
        setBrowserSteps(prevSteps => prevSteps.filter(step => step.actionId !== actionId));
    };

    const updateBrowserTextStepLabel = (id: number, newLabel: string) => {
        setBrowserSteps(prevSteps =>
            prevSteps.map(step =>
                step.id === id ? { ...step, label: newLabel } : step
            )
        );
    };

    const updateListTextFieldLabel = (listId: number, fieldKey: string, newLabel: string) => {
        setBrowserSteps(prevSteps =>
            prevSteps.map(step => {
                if (step.type === 'list' && step.id === listId) {
                    // Ensure deep copy of the fields object
                    const updatedFields = {
                        ...step.fields,
                        [fieldKey]: {
                            ...step.fields[fieldKey],
                            label: newLabel
                        }
                    };

                    return {
                        ...step,
                        fields: updatedFields
                    };
                }
                return step;
            })
        );
    };

    const updateListStepData = (listId: number, extractedData: any[]) => {
        setBrowserSteps((prevSteps) => {
          return prevSteps.map(step => {
            if (step.type === 'list' && step.id === listId) {
              return {
                ...step,
                data: extractedData  // Add the extracted data to the step
              };
            }
            return step;
          });
        });
    };

    const updateScreenshotStepData = (id: number, screenshotData: string) => {
        setBrowserSteps(prevSteps => {
            return prevSteps.map(step => {
                if (step.type === 'screenshot' && step.id === id) {
                    return {
                        ...step,
                        screenshotData: screenshotData
                    };
                }
                return step;
            });
        });
    };

    const updateListStepLimit = (listId: number, limit: number) => {
        setBrowserSteps(prevSteps =>
          prevSteps.map(step => {
            if (step.type === 'list' && step.id === listId) {
              return {
                ...step,
                limit: limit
              };
            }
            return step;
          })
        );
    };

    const removeListTextField = (listId: number, fieldKey: string) => {
        setBrowserSteps(prevSteps =>
            prevSteps.map(step => {
                if (step.type === 'list' && step.id === listId) {
                    const { [fieldKey]: _, ...remainingFields } = step.fields;
                    return {
                        ...step,
                        fields: remainingFields
                    };
                }
                return step;
            })
        );
        setDiscardedFields(prevDiscarded => new Set(prevDiscarded).add(`${listId}-${fieldKey}`));
    };
    return (
        <BrowserStepsContext.Provider value={{
            browserSteps,
            addTextStep,
            addListStep,
            addScreenshotStep,
            deleteBrowserStep,
            updateBrowserTextStepLabel,
            updateListTextFieldLabel,
            updateListStepLimit,
            updateListStepData,
            removeListTextField,
            deleteStepsByActionId,
            updateScreenshotStepData,
        }}>
            {children}
        </BrowserStepsContext.Provider>
    );
};

export const useBrowserSteps = () => {
    const context = useContext(BrowserStepsContext);
    if (!context) {
        throw new Error('useBrowserSteps must be used within a BrowserStepsProvider');
    }
    return context;
};
