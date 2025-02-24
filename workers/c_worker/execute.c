#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

int main()
{
    int n;
    printf("Enter the number of integers: ");
    scanf("%d", &n);

    // Allocate memory for n integers
    int *arr = (int *)malloc(n * sizeof(int));
    if (arr == NULL) {
        fprintf(stderr, "Memory allocation failed\n");
        return 1;
    }

    // Assign index values to the allocated memory
    for (int i = 0; i < n; i++) {
        arr[i] = i;
    }

    // Print the values to verify
    for (int i = 0; i < n; i++) {
        printf("arr[%d] = %d\n", i, arr[i]);
    }

    // Free the allocated memory
    free(arr);

    return 0;
}
